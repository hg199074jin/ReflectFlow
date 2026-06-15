import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createAISlice, type AISlice } from '../aiSlice';

describe('aiSlice', () => {
  let store: StoreApi<AISlice>;

  beforeEach(() => {
    store = create<AISlice>(
      createAISlice as StateCreator<AISlice, [], [], AISlice>
    );
  });

  it('setAIInFlight(true) adds a key', () => {
    store.getState().setAIInFlight('key-1', true);
    expect(store.getState().aiInFlight['key-1']).toBe(true);
  });

  it('setAIInFlight(false) REMOVES the key (not sets to false)', () => {
    store.getState().setAIInFlight('key-1', true);
    store.getState().setAIInFlight('key-1', false);
    // Regression: the key must be absent, not false
    expect(store.getState().aiInFlight).not.toHaveProperty('key-1');
    expect(Object.keys(store.getState().aiInFlight)).not.toContain('key-1');
  });

  it('setAIInFlight supports multiple independent keys', () => {
    store.getState().setAIInFlight('a', true);
    store.getState().setAIInFlight('b', true);
    expect(store.getState().aiInFlight['a']).toBe(true);
    expect(store.getState().aiInFlight['b']).toBe(true);

    store.getState().setAIInFlight('a', false);
    expect(store.getState().aiInFlight).not.toHaveProperty('a');
    expect(store.getState().aiInFlight['b']).toBe(true);
  });

  it('setAIInFlight(false) on non-existent key is a no-op', () => {
    store.getState().setAIInFlight('nonexistent', false);
    expect(store.getState().aiInFlight).not.toHaveProperty('nonexistent');
  });
});
