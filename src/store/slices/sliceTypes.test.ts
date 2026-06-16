import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import type { SliceCreator } from './sliceTypes';

interface TestSlice {
  value: number;
  setValue: (n: number) => void;
}

const createTestSlice: SliceCreator<TestSlice> = (set) => ({
  value: 0,
  setValue: (n) => set({ value: n }),
});

describe('SliceCreator type', () => {
  it('allows a slice to be composed into a zustand store', () => {
    // The slice declares the middleware set in Mps (devtools + persist).
    // The runtime call to `create` uses a plain StateCreator because the
    // middleware wrappers are applied by the final store in Task 1.6, not
    // here. This test only verifies the slice produces a valid state shape
    // and supports set/get — the type contract is asserted separately.
    const useTest = create<ReturnType<typeof createTestSlice>>()(
      createTestSlice as StateCreator<
        TestSlice,
        [],
        [],
        TestSlice
      >
    );
    useTest.getState().setValue(42);
    expect(useTest.getState().value).toBe(42);
  });

  it('is structurally assignable to the underlying zustand StateCreator', () => {
    // Compile-time check: SliceCreator<TestSlice> with devtools + persist
    // mutators must be assignable to the same StateCreator shape. The
    // assignment fails at the type level if the tuple drifts from the
    // middleware used by the final store.
    const _check: StateCreator<
      TestSlice,
      [['zustand/devtools', never], ['zustand/persist', unknown]],
      [],
      TestSlice
    > = createTestSlice;
    expect(_check).toBe(createTestSlice);
  });
});
