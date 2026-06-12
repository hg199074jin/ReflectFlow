import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOpenAICompatibleProvider } from './openaiCompatible';
import { AuthError, NetworkError, SchemaError } from './types';
import { makeEntry } from '../../test/fixtures';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const settings = {
  provider: 'openai-compatible' as const,
  apiKey: 'sk-test-key',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
};

describe('createOpenAICompatibleProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('generateReflection', () => {
    it('posts to chat completions endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Good reflection' } }] }),
      });

      const provider = createOpenAICompatibleProvider(settings);
      const result = await provider.generateReflection(makeEntry());

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toBe('Good reflection');
    });

    it('includes authorization header when apiKey present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      });

      const provider = createOpenAICompatibleProvider(settings);
      await provider.generateReflection(makeEntry());

      const [, opts] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];
      expect(opts.headers['Authorization']).toBe('Bearer sk-test-key');
    });

    it('omits authorization header when no apiKey', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
      });

      const provider = createOpenAICompatibleProvider({ ...settings, apiKey: '' });
      await provider.generateReflection(makeEntry());

      const [, opts] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];
      expect(opts.headers['Authorization']).toBeUndefined();
    });

    it('throws AuthError on 401', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' });
      const provider = createOpenAICompatibleProvider(settings);
      await expect(provider.generateReflection(makeEntry())).rejects.toThrow(AuthError);
    });

    it('throws NetworkError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const provider = createOpenAICompatibleProvider(settings);
      await expect(provider.generateReflection(makeEntry())).rejects.toThrow(NetworkError);
    });
  });

  describe('generateWeekSummary', () => {
    it('aggregates entries in prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Week summary' } }] }),
      });

      const provider = createOpenAICompatibleProvider(settings);
      const entries = [
        makeEntry({ date: '2026-06-08' }),
        makeEntry({ date: '2026-06-09' }),
      ];
      const result = await provider.generateWeekSummary(entries, '2026-06-08');
      expect(result).toBe('Week summary');
    });
  });

  describe('classifyProjects', () => {
    it('parses valid JSON response', async () => {
      const response = {
        projects: [
          { name: 'Project A', bulletIds: ['b1', 'b2'] },
          { name: 'Project B', bulletIds: ['b3'] },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(response) } }] }),
      });

      const provider = createOpenAICompatibleProvider(settings);
      const result = await provider.classifyProjects([
        { entryId: 'e1', date: '2026-06-13', category: 'work', bulletId: 'b1', text: 'task a' },
        { entryId: 'e1', date: '2026-06-13', category: 'work', bulletId: 'b2', text: 'task b' },
        { entryId: 'e1', date: '2026-06-13', category: 'work', bulletId: 'b3', text: 'task c' },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('Project A');
    });

    it('throws SchemaError on invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'not json' } }] }),
      });

      const provider = createOpenAICompatibleProvider(settings);
      await expect(provider.classifyProjects([])).rejects.toThrow(SchemaError);
    });
  });
});
