import { addDays, subDays, format } from 'date-fns';
import type { Goal, Entry, DailyGoalTarget, Principle } from './schema';
import { createId } from './ids';

/**
 * Generate example data for first-time users.
 * Returns a goal, 3 days of entries, daily targets, and a principle.
 */
export function getExampleData(): {
  goal: Goal;
  entries: Entry[];
  dailyTargets: DailyGoalTarget[];
  principles: Principle[];
} {
  const today = new Date();
  const goalStartDate = format(subDays(today, 5), 'yyyy-MM-dd');
  const goalEndDate = format(addDays(today, 25), 'yyyy-MM-dd');

  const goalId = createId();

  const goal: Goal = {
    id: goalId,
    title: '发布 ReflectFlow 第一个公开版本',
    period: 'month',
    startDate: goalStartDate,
    endDate: goalEndDate,
    status: 'active',
    linkedBullets: [],
    currentState: '已有核心页面和本地存储，但品牌、目标联动和 README 还不完善',
    desiredOutcome: '完成一个可演示、可部署、可复盘的公开版本',
    availableTime: '工作日晚上 1.5 小时，周末时间较少',
    priority: 'high',
    successCriteria: [
      'README 能清楚说明项目定位、安装方式和核心功能',
      '有一个可以访问的演示地址',
      '用户可以完成"设目标 → AI 拆解 → 每日复盘 → 查看差距"的核心闭环',
    ],
    constraints: [
      '周末可投入时间较少',
      '暂不做登录、云同步和多端账户',
      '优先保证核心流程闭环',
    ],
    createdAt: goalStartDate,
    updatedAt: goalStartDate,
  };

  // Generate 3 days of entries
  const entries: Entry[] = [];
  for (let i = 2; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    entries.push({
      id: createId(),
      date,
      bullets: {
        work: [{ id: createId(), text: '完成当日开发任务' }],
        study: [{ id: createId(), text: '学习 React 最佳实践' }],
        side: [{ id: createId(), text: '推进 ReflectFlow 开发' }],
      },
      review: {
        target: '推进目标拆解功能',
        gap: '部分任务未完成',
        reason: '时间不足',
        lesson: '任务粒度需要更小',
      },
      ai: {},
      createdAt: date,
      updatedAt: date,
    });
  }

  // Generate daily targets
  const dailyTargets: DailyGoalTarget[] = [];
  for (let i = 2; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    dailyTargets.push({
      id: createId(),
      goalId,
      date,
      plannedTask: '完成目标拆解功能的数据结构设计',
      minimumStandard: 'schema 中新增 GoalPlan 类型',
      expectedOutput: '代码中可以保存一个 AI 拆解后的目标计划',
      reviewQuestions: [
        '今天是否完成最低标准？',
        '如果没有完成，主要差距在哪里？',
        '明天是否需要调整任务粒度？',
      ],
      status: i === 0 ? 'pending' : 'completed',
      createdBy: 'ai',
      createdAt: date,
      updatedAt: date,
    });
  }

  // Example principles
  const principles: Principle[] = [
    {
      id: createId(),
      title: '每日任务必须小于 90 分钟',
      content: '超过 90 分钟的任务连续 3 次延期，而拆成 45-60 分钟后完成率明显提高。',
      sourceConclusionId: '',
      sourceReviewCaseId: '',
      evidenceRefs: [],
      applicableContexts: ['工作日晚上进行个人项目开发'],
      boundaries: ['周末有完整半天时间时，可以安排较大任务'],
      verificationStatus: 'validated',
      createdAt: format(subDays(today, 3), 'yyyy-MM-dd'),
      updatedAt: format(subDays(today, 3), 'yyyy-MM-dd'),
    },
  ];

  return { goal, entries, dailyTargets, principles };
}
