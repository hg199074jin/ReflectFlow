import type { SliceCreator } from './sliceTypes';

export interface StreamingState {
  id: string;
  feature: string;
  targetId: string;
  status: 'streaming' | 'done' | 'error';
  accumulated: string;
  error?: string;
}

export interface AISlice {
  aiInFlight: Record<string, boolean>;
  /** Streaming state tracking. Currently unused by goal components (they use local useState),
   *  but kept as infrastructure for future global AI activity indicators and cross-feature coordination. */
  streamingStates: Record<string, StreamingState>;
  setAIInFlight: (key: string, inFlight: boolean) => void;
  startStreaming: (id: string, feature: string, targetId: string) => void;
  updateStreaming: (id: string, chunk: string) => void;
  finishStreaming: (id: string) => void;
  failStreaming: (id: string, error: string) => void;
}

export const createAISlice: SliceCreator<AISlice> = (set) => ({
  aiInFlight: {},
  streamingStates: {},

  setAIInFlight: (key, inFlight) => {
    set((state) => ({
      aiInFlight: inFlight
        ? { ...state.aiInFlight, [key]: true }
        : Object.fromEntries(Object.entries(state.aiInFlight).filter(([k]) => k !== key)),
    }));
  },

  startStreaming: (id, feature, targetId) => {
    set((state) => ({
      streamingStates: {
        ...state.streamingStates,
        [id]: { id, feature, targetId, status: 'streaming', accumulated: '' },
      },
    }));
  },

  updateStreaming: (id, chunk) => {
    set((state) => {
      const existing = state.streamingStates[id];
      if (!existing) return state;
      return {
        streamingStates: {
          ...state.streamingStates,
          [id]: { ...existing, accumulated: existing.accumulated + chunk },
        },
      };
    });
  },

  finishStreaming: (id) => {
    set((state) => {
      const existing = state.streamingStates[id];
      if (!existing) return state;
      return {
        streamingStates: {
          ...state.streamingStates,
          [id]: { ...existing, status: 'done' },
        },
      };
    });
  },

  failStreaming: (id, error) => {
    set((state) => {
      const existing = state.streamingStates[id];
      if (!existing) return state;
      return {
        streamingStates: {
          ...state.streamingStates,
          [id]: { ...existing, status: 'error', error },
        },
      };
    });
  },
});
