import { useState, useRef, useCallback } from 'react';

interface UseAIStreamingOptions<T> {
  /** The async AI function to call */
  run: (signal: AbortSignal) => Promise<{ success: true; data: T } | { success: false; error: string }>;
  /** Called when the AI returns a successful result */
  onSuccess: (data: T) => void;
}

/**
 * Shared hook for goal-related AI streaming panels.
 * Manages streaming state, error state, abort controller, and the cancel handler.
 */
export function useAIStreaming<T>({ run, onSuccess }: UseAIStreamingOptions<T>) {
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    setStreaming(true);
    setError(null);
    setStreamedText('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await run(controller.signal);
      if (result.success) {
        onSuccess(result.data);
      } else if (controller.signal.aborted) {
        setError('已取消生成');
      } else {
        setError('解析失败：' + result.error);
      }
    } catch (e) {
      if (controller.signal.aborted) {
        setError('已取消生成');
      } else {
        setError(e instanceof Error ? e.message : '未知错误');
      }
    } finally {
      setStreaming(false);
      setStreamedText('');
      abortRef.current = null;
    }
  }, [run, onSuccess]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { streaming, error, streamedText, setStreamedText, execute, cancel };
}
