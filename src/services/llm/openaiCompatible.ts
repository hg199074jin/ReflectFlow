import type { LLMProvider, LLMSettings } from './types';
import { LLMError, AuthError, RateLimitError, NetworkError, SchemaError } from './types';
import type { Entry, ClassifiableBullet } from '../../lib/schema';
import { buildReflectionPrompt, buildReflectionQuestionsPrompt, buildWeekSummaryPrompt, buildProjectClassificationPrompt } from '../../lib/prompts';

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/** Remove <think>...</think> tags and other reasoning artifacts from LLM response */
function cleanResponse(content: string): string {
  // Remove <think>...</think> blocks
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '');
  // Remove <think>...</think> blocks (some models use different casing)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Trim whitespace
  return cleaned.trim();
}

async function callAPI(settings: LLMSettings, messages: Array<{ role: string; content: string }>): Promise<string> {
  const url = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const body = JSON.stringify({
    model: settings.model,
    messages,
    temperature: 0.2,
  });

  try {
    const response = await fetch(url, { method: 'POST', headers, body });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 401) throw new AuthError(text);
      if (response.status === 429) throw new RateLimitError(text);
      throw new LLMError(`API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as ChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new SchemaError('Invalid response structure');
    }
    return cleanResponse(content);
  } catch (err) {
    if (err instanceof LLMError) throw err;
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new NetworkError();
    }
    throw new LLMError(String(err));
  }
}

export function createOpenAICompatibleProvider(settings: LLMSettings): LLMProvider {
  return {
    async generateReflection(entry: Entry): Promise<string> {
      const prompt = buildReflectionPrompt(entry);
      return callAPI(settings, [
        { role: 'system', content: '你是一个工作日志复盘助手。直接输出复盘总结，不要包含任何思考过程、推理步骤或标签。' },
        { role: 'user', content: prompt },
      ]);
    },

    async generateReflectionQuestions(entry: Entry): Promise<string[]> {
      const prompt = buildReflectionQuestionsPrompt(entry);
      const raw = await callAPI(settings, [
        { role: 'system', content: '你是一个复盘引导助手。生成引导深度思考的问题，每行一个问题。直接返回问题，不要有其他内容。' },
        { role: 'user', content: prompt },
      ]);

      return raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line.includes('？') || line.includes('?'));
    },

    async generateWeekSummary(entries: Entry[], weekStart: string): Promise<string> {
      const prompt = buildWeekSummaryPrompt(entries, weekStart);
      return callAPI(settings, [
        { role: 'system', content: '你是一个工作日志周总结助手。直接输出总结内容，不要包含任何思考过程、推理步骤或标签。' },
        { role: 'user', content: prompt },
      ]);
    },

    async classifyProjects(bullets: ClassifiableBullet[]): Promise<Array<{ name: string; bulletIds: string[] }>> {
      const prompt = buildProjectClassificationPrompt(bullets);
      const raw = await callAPI(settings, [
        { role: 'system', content: '你是一个工作日志分类助手。直接返回JSON，不要包含任何思考过程、推理步骤或标签。' },
        { role: 'user', content: prompt },
      ]);

      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        const parsed = JSON.parse(jsonMatch[0]) as { projects: Array<{ name: string; bulletIds: string[] }> };
        if (!Array.isArray(parsed.projects)) throw new Error('Invalid projects array');
        return parsed.projects;
      } catch (err) {
        throw new SchemaError(`Failed to parse project classification: ${err}`);
      }
    },
  };
}
