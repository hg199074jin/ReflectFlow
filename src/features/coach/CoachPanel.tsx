import { useState, useCallback, useRef, useEffect } from 'react';
import { useTimelineStore } from '../../store';
import { askCoach } from '../../services/coachAI';
import { loadGoalConflicts } from '../../store/persistence';
import { Button } from '../../components/primitives/Button';
import type { CoachContext } from '../../lib/coachPrompts';
import type { GoalConflict } from '../../lib/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function CoachPanel() {
  const settings = useTimelineStore((s) => s.settings);
  const goals = useTimelineStore((s) => s.goals);
  const dailyGoalTargets = useTimelineStore((s) => s.dailyGoalTargets);
  const entries = useTimelineStore((s) => s.entries);
  const reviewCases = useTimelineStore((s) => s.reviewCases);
  const principles = useTimelineStore((s) => s.principles);

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<GoalConflict[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conflicts from persistence on mount
  useEffect(() => {
    loadGoalConflicts().then(setConflicts);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = useCallback((): CoachContext => {
    const activeGoals = Object.values(goals).filter((g) => g.status === 'active');
    const recentTargets = Object.values(dailyGoalTargets)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);
    const recentEntries = Object.values(entries)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    const activeConflicts = conflicts;
    const recentConclusions = Object.values(reviewCases)
      .filter((rc) => rc.conclusions.length > 0)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3);
    const principleSnippets = Object.values(principles)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 10);

    return {
      activeGoals,
      recentDailyTargets: recentTargets,
      recentEntries,
      activeConflicts,
      recentConclusions,
      principleSnippets,
    };
  }, [goals, dailyGoalTargets, entries, conflicts, reviewCases, principles]);

  const handleAsk = async () => {
    if (!question.trim() || streaming) return;

    const userMessage: Message = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setStreaming(true);
    setError(null);

    const context = buildContext();
    let fullText = '';

    try {
      await askCoach(userMessage.content, context, settings.llm, {
        onChunk: (chunk) => {
          fullText += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { role: 'assistant', content: fullText }];
            }
            return [...prev, { role: 'assistant', content: fullText }];
          });
        },
        onComplete: () => {
          setStreaming(false);
        },
        onError: (err) => {
          setError(err.message);
          setStreaming(false);
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="coach-panel">
      <h2>AI 教练</h2>
      <p className="coach-description">
        基于你的目标、记录和复盘数据，为你提供个性化的指导建议。
      </p>

      <div className="coach-messages">
        {messages.length === 0 && (
          <div className="coach-empty">
            <p>有什么想问的？试试这些问题：</p>
            <ul>
              <li>我当前的目标是否合理？</li>
              <li>本周最大的阻碍是什么？</li>
              <li>根据我的原则库，我应该注意什么？</li>
              <li>帮我分析最近的偏差原因。</li>
            </ul>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`coach-message coach-message-${msg.role}`}>
            <div className="coach-message-role">{msg.role === 'user' ? '你' : 'AI 教练'}</div>
            <div className="coach-message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="coach-error">{error}</div>}

      <div className="coach-input-area">
        <textarea
          className="coach-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题..."
          rows={3}
          disabled={streaming}
        />
        <Button onClick={handleAsk} disabled={streaming || !question.trim()}>
          {streaming ? '回答中...' : '发送'}
        </Button>
      </div>
    </div>
  );
}
