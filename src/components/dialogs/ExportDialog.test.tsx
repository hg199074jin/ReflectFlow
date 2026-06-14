import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportDialog } from './ExportDialog';
import { useTimelineStore } from '../../store';
import { clearAllData } from '../../store/persistence';

vi.mock('../../services/export/zip', () => ({
  createMarkdownZip: vi.fn().mockResolvedValue(new Blob(['mock'], { type: 'application/zip' })),
}));

vi.mock('../../services/export/png', () => ({
  exportNodeAsPng: vi.fn().mockResolvedValue(undefined),
}));

describe('ExportDialog', () => {
  const onClose = vi.fn();

  beforeEach(async () => {
    await clearAllData();
    onClose.mockReset();
    useTimelineStore.setState({
      entries: {},
      settings: {
        llm: { provider: 'openai-compatible', apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
        export: { folderStructure: 'year-month', includeAI: true },
      },
      selectedMonth: '2026-06',
      view: 'cards',
      aiInFlight: {},
    });
  });

  it('renders export controls', () => {
    render(<ExportDialog onClose={onClose} />);
    expect(screen.getByLabelText(/开始日期/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/结束日期/i)).toBeInTheDocument();
    expect(screen.getByText(/导出 Markdown/i)).toBeInTheDocument();
    expect(screen.getByText(/导出 PNG/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel clicked', () => {
    render(<ExportDialog onClose={onClose} />);
    fireEvent.click(screen.getByText('取消'));
    expect(onClose).toHaveBeenCalled();
  });
});
