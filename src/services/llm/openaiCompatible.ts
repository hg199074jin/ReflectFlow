import type { LLMProvider, LLMSettings } from './types';
import { LLMError, AuthError, RateLimitError, NetworkError, SchemaError } from './types';
import type { Entry, ClassifiableBullet } from '../../lib/schema';
import { buildReflectionPrompt, buildWeekSummaryPrompt, buildProjectClassificationPrompt } from '../../lib/prompts';

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
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
    return content;
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
        { role: 'system', content: 'You summarize a private daily work journal. Be concise and structured.' },
        { role: 'user', content: prompt },
      ]);
    },

    async generateWeekSummary(entries: Entry[], weekStart: string): Promise<string> {
      const prompt = buildWeekSummaryPrompt(entries, weekStart);
      return callAPI(settings, [
        { role: 'system', content: 'You summarize a private weekly work journal. Be concise and structured.' },
        { role: 'user', content: prompt },
      ]);
    },

    async classifyProjects(bullets: ClassifiableBullet[]): Promise<Array<{ name: string; bulletIds: string[] }>> {
      const prompt = buildProjectClassificationPrompt(bullets);
      const raw = await callAPI(settings, [
        { role: 'system', content: 'You classify work journal bullets into projects. Return only valid JSON.' },
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
