import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../../components/primitives/Button';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';
import type { Entry, WeeklyReview } from '../../lib/schema';

interface ReviewCoachPanelProps {
  entry?: Entry;
  weeklyReview?: WeeklyReview;
}

export function ReviewCoachPanel({ entry, weeklyReview }: ReviewCoachPanelProps) {
  const settings = useTimelineStore((s) => s.settings);

  const [questions, setQuestions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const provider = createOpenAICompatibleProvider(settings.llm);

      if (entry) {
        const raw = await provider.generateReflectionQuestions(entry);
        setQuestions(raw);
      } else if (weeklyReview) {
        // For weekly review, create a mock entry for the prompt
        const entries = useTimelineStore.getState().entries;
        const weekEntries = Object.values(entries).filter((e) => {
          const start = new Date(weeklyReview.weekStart + 'T00:00:00');
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          const endStr = end.toISOString().slice(0, 10);
          return e.date >= weeklyReview.weekStart && e.date <= endStr;
        });

        if (weekEntries.length > 0) {
          const firstEntry = weekEntries[0];
          if (firstEntry) {
            const raw = await provider.generateReflectionQuestions(firstEntry);
            setQuestions(raw);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopy = (question: string) => {
    navigator.clipboard.writeText(question);
  };

  return (
    <div className="review-coach-panel">
      <div className="review-coach-header">
        <h4 className="review-coach-title">AI Review Coach</h4>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          loading={generating}
        >
          Generate Questions
        </Button>
      </div>

      {error && <p className="review-coach-error">{error}</p>}

      {questions.length > 0 && (
        <div className="review-coach-questions">
          {questions.map((q, i) => (
            <div key={i} className="review-coach-question">
              <p className="review-coach-question-text">{q}</p>
              <div className="review-coach-question-actions">
                <button
                  className="review-coach-btn"
                  onClick={() => handleCopy(q)}
                  title="Copy"
                >
                  📋
                </button>
                <button
                  className="review-coach-btn"
                  onClick={() => handleDismiss(i)}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
