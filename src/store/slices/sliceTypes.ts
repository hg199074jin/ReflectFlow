// Side-effect import to load the devtools and persist StoreMutators
// augmentations declared in `zustand/middleware`. Without this, the
// 'zustand/devtools' and 'zustand/persist' mutator identifiers below are
// not recognized by the StateCreator constraint and TypeScript fails.
import 'zustand/middleware';
import type { StateCreator } from 'zustand';

export type SliceCreator<T> = StateCreator<
  T,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  T
>;
