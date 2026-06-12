import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AISection } from './AISection';
import { useTimelineStore } from '../../store';
import { clearAllData } from '../../store/persistence';

const mockGenerate = vi.fn();

vi.mock('../../services/llm/openaiCompatible', () => ({
  createOpenAICompatibleProvider: () => ({
    generateReflection: mockGenerate,
    generateWeekSummary: vi.fn(),
    classifyProjects: vi.fn(),
  }),
}));

describe('AISection', () => {
  beforeEach(async () => {
    await clearAllData();
    mockGenerate.mockReset();
    mockGenerate.mockResolvedValue('Great reflection');
    useTimelineStore.setState({
      entries: {},
      settings: {
        llm: { provider: 'openai-compatible', apiKey: 'test', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
        export: { folderStructure: 'year-month', includeAI: true },
      },
      selectedMonth: '2026-06',
      view: 'cards',
      aiInFlight: {},
    });
  });

  it('renders generate button', () => {
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task');
    render(<AISection date="2026-06-13" />);
    expect(screen.getByText('Generate')).toBeInTheDocument();
  });

  it('calls provider and shows reflection', async () => {
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task');
    render(<AISection date="2026-06-13" />);
    fireEvent.click(screen.getByText('Generate'));
    await waitFor(() => {
      expect(screen.getByText('Great reflection')).toBeInTheDocument();
    });
  });

  it('shows error on failure', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('API error'));
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task');
    render(<AISection date="2026-06-13" />);
    fireEvent.click(screen.getByText('Generate'));
    await waitFor(() => {
      expect(screen.getByText('API error')).toBeInTheDocument();
    });
  });

  it('shows regenerate button when reflection exists', () => {
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task');
    useTimelineStore.getState().setReflection('2026-06-13', 'Existing reflection');
    render(<AISection date="2026-06-13" />);
    expect(screen.getByText('Regenerate')).toBeInTheDocument();
  });

  it('copies reflection to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    useTimelineStore.getState().upsertEntryText('2026-06-13', 'work', 'task');
    useTimelineStore.getState().setReflection('2026-06-13', 'Copy me');
    render(<AISection date="2026-06-13" />);
    fireEvent.click(screen.getByText('Copy'));
    expect(writeText).toHaveBeenCalledWith('Copy me');
  });
});
