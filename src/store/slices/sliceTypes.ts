// Side-effect import to load the devtools StoreMutators augmentation
// declared in `zustand/middleware`. Without this, the 'zustand/devtools'
// mutator identifier below is not recognized by the StateCreator constraint
// and TypeScript fails.
import 'zustand/middleware';
import type { StateCreator } from 'zustand';

export type SliceCreator<T> = StateCreator<
  T,
  [['zustand/devtools', never]],
  [],
  T
>;
