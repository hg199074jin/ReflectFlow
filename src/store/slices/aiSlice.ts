import type { SliceCreator } from './sliceTypes';

export interface AISlice {
  aiInFlight: Record<string, boolean>;
  setAIInFlight: (key: string, inFlight: boolean) => void;
}

export const createAISlice: SliceCreator<AISlice> = (set) => ({
  aiInFlight: {},

  setAIInFlight: (key, inFlight) => {
    set((state) => ({
      aiInFlight: inFlight
        ? { ...state.aiInFlight, [key]: true }
        : Object.fromEntries(Object.entries(state.aiInFlight).filter(([k]) => k !== key)),
    }));
  },
});
