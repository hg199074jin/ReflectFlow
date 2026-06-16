import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { EntryEditor } from '../cards/EntryEditor';
import { ReviewEditor } from '../cards/ReviewEditor';
import { Button } from '../primitives/Button';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';
import { toDateKey, calculateStreak } from '../../lib/date';
import { DailyGoalReviewPanel } from '../../features/review/DailyGoalReviewPanel';

export function CheckinView() {
  const today = toDateKey(new Date());
  const entries = useTimelineStore((s) => s.entries);
  const settings = useTimelineStore((s) => s.settings);
  const entry = entries[today];
  const entriesList = Object.values(entries);
  const streak = calculateStreak(entriesList, today);
  const setReflection = useTimelineStore((s) => s.setReflection);
  const setAIQuestions = useTimelineStore((s) => s.setAIQuestions);
  const setQuestionAnswers = useTimelineStore((s) => s.setQuestionAnswers);
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

  const isFirstTime = entriesList.length === 0;

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

      {isFirstTime && (
        <div className="empty-state-guide">
          <div className="empty-state-icon">📝</div>
          <h3 className="empty-state-title">欢迎使用每日打卡</h3>
          <p className="empty-state-description">
            开始你的每日复盘习惯。记录今天做了什么、学到了什么、副业有什么进展。
          </p>
          <div className="empty-state-steps">
            <div className="empty-state-step">
              <span className="empty-state-step-number">1</span>
              <span className="empty-state-step-text">在下方输入今日事项 — 每行一条</span>
            </div>
            <div className="empty-state-step">
              <span className="empty-state-step-number">2</span>
              <span className="empty-state-step-text">点击「生成引导提问」，AI 帮你深度复盘</span>
            </div>
            <div className="empty-state-step">
              <span className="empty-state-step-number">3</span>
              <span className="empty-state-step-text">切换到「查看」模式，浏览时间线和统计</span>
            </div>
          </div>
        </div>
      )}

      <div className="checkin-editor-section">
        <h3 className="checkin-section-title">今日事项</h3>
        <EntryEditor date={today} />
      </div>

      <div className="checkin-review-section">
        <DailyGoalReviewPanel date={today} />
        <ReviewEditor date={today} />
      </div>

      <div className="checkin-ai-section">
        <h3 className="checkin-section-title">AI辅助复盘</h3>

        {entry?.ai?.questions && entry.ai.questions.length > 0 && (
          <div className="checkin-questions">
            <h4>引导提问</h4>
            {entry.ai.questions.map((q, i) => (
              <div key={i} className="checkin-question-item">
                <p className="checkin-question-text">{q}</p>
                <textarea
                  className="checkin-question-answer"
                  value={entry.ai?.questionAnswers?.[i] ?? ''}
                  onChange={(e) => {
                    const answers = [...(entry.ai?.questionAnswers ?? [])];
                    answers[i] = e.target.value;
                    setQuestionAnswers(today, answers);
                  }}
                  placeholder="写下你的思考..."
                  rows={2}
                />
              </div>
            ))}
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
