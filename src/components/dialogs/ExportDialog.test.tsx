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
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByText(/export markdown/i)).toBeInTheDocument();
    expect(screen.getByText(/export png/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel clicked', () => {
    render(<ExportDialog onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
