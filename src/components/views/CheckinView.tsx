import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { EntryEditor } from '../cards/EntryEditor';
import { ReviewEditor } from '../cards/ReviewEditor';
import { Button } from '../primitives/Button';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';
import { toDateKey, calculateStreak } from '../../lib/date';

export function CheckinView() {
  const today = toDateKey(new Date());
  const entries = useTimelineStore((s) => s.entries);
  const settings = useTimelineStore((s) => s.settings);
  const entry = entries[today];
  const entriesList = Object.values(entries);
  const streak = calculateStreak(entriesList, today);
  const setReflection = useTimelineStore((s) => s.setReflection);
  const setAIQuestions = useTimelineStore((s) => s.setAIQuestions);
  const setAIInFlight = useTimelineStore((s) => s.setAIInFlight);

  const [error, setError] = useState<string | null>(null);

  const bulletCount = entry
    ? entry.bullets.work.length + entry.bullets.study.length + entry.bullets.side.length
    : 0;

  const handleGenerateQuestions = async () => {
    if (!entry) return;
    setAIInFlight('questions-' + today, true);
    setError(null);
    try {
      const provider = createOpenAICompatibleProvider(settings.llm);
      const questions = await provider.generateReflectionQuestions(entry);
      setAIQuestions(today, questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setAIInFlight('questions-' + today, false);
    }
  };

  const handleGenerateReflection = async () => {
    if (!entry) return;
    setAIInFlight('reflection-' + today, true);
    setError(null);
    try {
      const provider = createOpenAICompatibleProvider(settings.llm);
      const reflection = await provider.generateReflection(entry);
      setReflection(today, reflection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setAIInFlight('reflection-' + today, false);
    }
  };

  const isGeneratingQuestions = useTimelineStore((s) => s.aiInFlight['questions-' + today]);
  const isGeneratingReflection = useTimelineStore((s) => s.aiInFlight['reflection-' + today]);

  return (
    <div className="checkin-view">
      <div className="checkin-header">
        <div className="checkin-date-section">
          <h2 className="checkin-date">{today}</h2>
          <span className="checkin-weekday">{getWeekday(today)}</span>
        </div>
        <div className="checkin-stats">
          {streak > 0 && (
            <span className="streak-badge">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
          )}
          {bulletCount > 0 && (
            <span className="checkin-bullet-count">{bulletCount} bullet{bulletCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className="checkin-editor-section">
        <h3 className="checkin-section-title">今日事项</h3>
        <EntryEditor date={today} />
      </div>

      <div className="checkin-review-section">
        <ReviewEditor date={today} />
      </div>

      <div className="checkin-ai-section">
        <h3 className="checkin-section-title">AI辅助复盘</h3>

        {entry?.ai?.questions && entry.ai.questions.length > 0 && (
          <div className="checkin-questions">
            <h4>引导提问</h4>
            <ul>
              {entry.ai.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="checkin-error">{error}</p>}

        <div className="checkin-ai-actions">
          <Button
            variant="secondary"
            onClick={handleGenerateQuestions}
            loading={isGeneratingQuestions}
            disabled={!entry || bulletCount === 0}
          >
            生成引导提问
          </Button>
          <Button
            variant="secondary"
            onClick={handleGenerateReflection}
            loading={isGeneratingReflection}
            disabled={!entry || bulletCount === 0}
          >
            {entry?.ai?.reflection ? '重新生成复盘' : 'AI生成复盘'}
          </Button>
        </div>

        {entry?.ai?.reflection && (
          <div className="checkin-reflection">
            <h4>AI复盘总结</h4>
            <div className="checkin-reflection-content">
              {entry.ai.reflection}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getWeekday(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()] ?? '';
}
