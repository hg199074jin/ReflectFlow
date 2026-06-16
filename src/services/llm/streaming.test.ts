import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamChatCompletion } from './streaming';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockSettings = {
  provider: 'openai-compatible' as const,
  apiKey: 'test-key',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.test.com/v1',
};

function makeStreamResponse(chunks: string[]) {
  return {
    ok: true,
    status: 200,
    body: new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    }),
  };
}

describe('streamChatCompletion', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('accumulates chunks into full text', async () => {
    mockFetch.mockResolvedValueOnce(makeStreamResponse([
      'data: {"choices":[{"delta":{"content":"hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n',
    ]));

    const chunks: string[] = [];
    const full: string[] = [];
    await streamChatCompletion(
      [{ role: 'user', content: 'hi' }],
      mockSettings,
      {
        onChunk: (c) => chunks.push(c),
        onComplete: (t) => full.push(t),
        onError: () => {},
      }
    );
    expect(chunks.join('')).toBe('hello world');
    expect(full[0]).toBe('hello world');
  });

  it('sends Authorization header with apiKey', async () => {
    mockFetch.mockResolvedValueOnce(makeStreamResponse(['data: [DONE]\n\n']));

    await streamChatCompletion(
      [{ role: 'user', content: 'hi' }],
      mockSettings,
      { onChunk: () => {}, onComplete: () => {}, onError: () => {} }
    );
    const [, opts] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(opts.headers['Authorization']).toBe('Bearer test-key');
  });

  it('sends stream: true in request body', async () => {
    mockFetch.mockResolvedValueOnce(makeStreamResponse(['data: [DONE]\n\n']));

    await streamChatCompletion(
      [{ role: 'user', content: 'hi' }],
      mockSettings,
      { onChunk: () => {}, onComplete: () => {}, onError: () => {} }
    );
    const [, opts] = mockFetch.mock.calls[0] as [string, { body: string }];
    const body = JSON.parse(opts.body);
    expect(body.stream).toBe(true);
    expect(body.model).toBe('gpt-4o-mini');
  });

  it('calls onError on 401 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const errors: Error[] = [];
    await streamChatCompletion(
      [{ role: 'user', content: 'hi' }],
      mockSettings,
      { onChunk: () => {}, onComplete: () => {}, onError: (e) => errors.push(e) }
    );
    expect(errors.length).toBe(1);
    expect(errors[0]!.message).toBe('Invalid API key');
  });

  it('calls onError on 429 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Too many requests',
    });

    const errors: Error[] = [];
    await streamChatCompletion(
      [{ role: 'user', content: 'hi' }],
      mockSettings,
      { onChunk: () => {}, onComplete: () => {}, onError: (e) => errors.push(e) }
    );
    expect(errors.length).toBe(1);
    expect(errors[0]!.message).toBe('Rate limit exceeded');
  });

  it('calls onError on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const errors: Error[] = [];
    await streamChatCompletion(
      [{ role: 'user', content: 'hi' }],
      mockSettings,
      { onChunk: () => {}, onComplete: () => {}, onError: (e) => errors.push(e) }
    );
    expect(errors.length).toBe(1);
  });

  it('ignores malformed SSE lines gracefully', async () => {
    mockFetch.mockResolvedValueOnce(makeStreamResponse([
      'data: {not valid json}\n\n',
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
      'data: [DONE]\n\n',
    ]));

    const chunks: string[] = [];
    await streamChatCompletion(
      [{ role: 'user', content: 'hi' }],
      mockSettings,
      { onChunk: (c) => chunks.push(c), onComplete: () => {}, onError: () => {} }
    );
    expect(chunks.join('')).toBe('ok');
  });
});
