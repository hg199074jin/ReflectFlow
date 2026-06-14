import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';
import { Button } from '../primitives/Button';
import { MarkdownRender } from '../primitives/MarkdownRender';

interface AISectionProps {
  date: string;
}

export function AISection({ date }: AISectionProps) {
  const entry = useTimelineStore((s) => s.entries[date]);
  const settings = useTimelineStore((s) => s.settings);
  const aiInFlight = useTimelineStore((s) => s.aiInFlight[date]);
  const setAIInFlight = useTimelineStore((s) => s.setAIInFlight);
  const setReflection = useTimelineStore((s) => s.setReflection);
  const [error, setError] = useState<string | null>(null);

  if (!entry) return null;

  const handleGenerate = async () => {
    setAIInFlight(date, true);
    setError(null);
    try {
      const provider = createOpenAICompatibleProvider(settings.llm);
      const reflection = await provider.generateReflection(entry);
      setReflection(date, reflection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setAIInFlight(date, false);
    }
  };

  const handleCopy = () => {
    if (entry.ai?.reflection) {
      navigator.clipboard.writeText(entry.ai.reflection);
    }
  };

  return (
    <div className="ai-section">
      <div className="ai-section-header">
        <span className="ai-section-title">AI 复盘</span>
        <div className="ai-section-actions">
          {entry.ai?.reflection && (
            <Button variant="ghost" onClick={handleCopy}>复制</Button>
          )}
          <Button variant="secondary" onClick={handleGenerate} loading={aiInFlight}>
            {entry.ai?.reflection ? '重新生成' : '生成复盘'}
          </Button>
        </div>
      </div>
      {error && <p className="ai-error">{error}</p>}
      {entry.ai?.reflection && <MarkdownRender content={entry.ai.reflection} />}
    </div>
  );
}
