import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsDialog } from './SettingsDialog';
import { useTimelineStore } from '../../store';
import { clearAllData } from '../../store/persistence';

describe('SettingsDialog', () => {
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

  it('renders settings fields', () => {
    render(<SettingsDialog onClose={onClose} />);
    expect(screen.getByLabelText(/base url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
  });

  it('saves settings', async () => {
    render(<SettingsDialog onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/base url/i), { target: { value: 'http://localhost:8080/v1' } });
    fireEvent.change(screen.getByLabelText(/model/i), { target: { value: 'llama3' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      const settings = useTimelineStore.getState().settings;
      expect(settings.llm.baseUrl).toBe('http://localhost:8080/v1');
      expect(settings.llm.model).toBe('llama3');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error for missing baseUrl', () => {
    render(<SettingsDialog onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/base url/i), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel clicked', () => {
    render(<SettingsDialog onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
