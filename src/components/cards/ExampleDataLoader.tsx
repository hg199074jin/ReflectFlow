import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { getExampleData } from '../../lib/exampleData';
import { formatBulletText } from '../../lib/text';
import { Button } from '../primitives/Button';

export function ExampleDataLoader() {
  const [dismissed, setDismissed] = useState(false);
  const store = useTimelineStore();

  if (dismissed) return null;

  // Check if store is empty
  const isEmpty =
    Object.keys(store.entries).length === 0 &&
    Object.keys(store.goals).length === 0;
  if (!isEmpty) return null;

  const handleLoad = () => {
    const data = getExampleData();

    // Load goal
    store.upsertGoal(data.goal);

    // Load entries — convert bullets back to text for upsertEntryText
    data.entries.forEach((e) => {
      if (e.bullets.work.length > 0) {
        store.upsertEntryText(e.date, 'work', formatBulletText(e.bullets.work));
      }
      if (e.bullets.study.length > 0) {
        store.upsertEntryText(e.date, 'study', formatBulletText(e.bullets.study));
      }
      if (e.bullets.side.length > 0) {
        store.upsertEntryText(e.date, 'side', formatBulletText(e.bullets.side));
      }
    });

    // Load daily targets
    data.dailyTargets.forEach((t) => store.addDailyGoalTarget(t));

    // Load principles
    data.principles.forEach((p) => store.upsertPrinciple(p));

    setDismissed(true);
  };

  return (
    <div className="example-data-loader">
      <div className="example-data-content">
        <p className="example-data-title">首次使用？</p>
        <p className="example-data-description">
          加载示例数据来体验目标设定、每日复盘、偏差分析等完整功能。
        </p>
        <div className="example-data-actions">
          <Button variant="primary" size="sm" onClick={handleLoad}>
            加载示例数据
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            跳过
          </Button>
        </div>
      </div>
    </div>
  );
}
