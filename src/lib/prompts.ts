import type { Entry, ClassifiableBullet } from './schema';
import { formatBulletText } from './text';

/** Build prompt for daily reflection */
export function buildReflectionPrompt(entry: Entry): string {
  const sections: string[] = [];

  if (entry.bullets.work.length > 0) {
    sections.push(`Work:\n${formatBulletText(entry.bullets.work)}`);
  }
  if (entry.bullets.study.length > 0) {
    sections.push(`Study:\n${formatBulletText(entry.bullets.study)}`);
  }
  if (entry.bullets.side.length > 0) {
    sections.push(`Side projects:\n${formatBulletText(entry.bullets.side)}`);
  }

  return `Date: ${entry.date}

Today's activities:
${sections.join('\n\n')}

Write a brief one-paragraph reflection on this day. Focus on what was accomplished, what was learned, and any notable observations. Be concise and constructive.`;
}

/** Build prompt for weekly summary */
export function buildWeekSummaryPrompt(entries: Entry[], weekStart: string): string {
  const daySummaries = entries.map((e) => {
    const bullets = [...e.bullets.work, ...e.bullets.study, ...e.bullets.side];
    if (bullets.length === 0) return `${e.date}: (no entries)`;
    return `${e.date}:\n${bullets.map((b) => `- ${b.text}`).join('\n')}`;
  });

  return `Week starting ${weekStart}:

${daySummaries.join('\n\n')}

Write a structured weekly summary. Highlight key accomplishments, patterns, and areas for improvement. Be concise.`;
}

/** Build prompt for project classification */
export function buildProjectClassificationPrompt(bullets: ClassifiableBullet[]): string {
  const bulletList = bullets.map((b) => `[${b.bulletId}] (${b.category}, ${b.date}): ${b.text}`).join('\n');

  return `Here are bullet points from a work journal, each with a unique ID:

${bulletList}

Group these bullets into projects. Return ONLY valid JSON in this exact format:
{
  "projects": [
    {
      "name": "Project Name",
      "bulletIds": ["bullet-id-1", "bullet-id-2"]
    }
  ]
}

Rules:
- Every bullet ID must appear exactly once across all projects
- Project names should be descriptive and concise
- Group related bullets together based on topic/context
- Return ONLY the JSON, no other text`;
}
