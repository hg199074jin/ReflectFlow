import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createEntrySlice, type EntrySlice } from '../entrySlice';
import 'fake-indexeddb/auto';

describe('entrySlice', () => {
  let store: StoreApi<EntrySlice>;

  beforeEach(() => {
    // Cast to plain StateCreator because the final store (Task 1.6) applies
    // devtools + persist middleware. Here we only need the state shape.
    store = create<EntrySlice>(
      createEntrySlice as StateCreator<EntrySlice, [], [], EntrySlice>
    );
  });

  it('upsertEntryText creates an entry with bullets', () => {
    store.getState().upsertEntryText('2026-06-15', 'work', 'task one\ntask two');
    const entry = store.getState().entries['2026-06-15'];
    expect(entry).toBeDefined();
    expect(entry!.bullets.work).toHaveLength(2);
    expect(entry!.bullets.work[0]!.text).toBe('task one');
    expect(entry!.bullets.work[1]!.text).toBe('task two');
    expect(entry!.rawText?.work).toBe('task one\ntask two');
  });

  it('upsertEntryText updates an existing entry', () => {
    store.getState().upsertEntryText('2026-06-15', 'work', 'task one');
    store.getState().upsertEntryText('2026-06-15', 'work', 'updated task');
    const entry = store.getState().entries['2026-06-15'];
    expect(entry!.bullets.work).toHaveLength(1);
    expect(entry!.bullets.work[0]!.text).toBe('updated task');
  });

  it('deleteEntry removes the entry', async () => {
    store.getState().upsertEntryText('2026-06-15', 'work', 'task');
    expect(store.getState().entries['2026-06-15']).toBeDefined();
    await store.getState().deleteEntry('2026-06-15');
    expect(store.getState().entries['2026-06-15']).toBeUndefined();
  });

  it('setReflection updates ai.reflection on existing entry', () => {
    store.getState().upsertEntryText('2026-06-15', 'work', 'task');
    store.getState().setReflection('2026-06-15', 'some reflection');
    expect(store.getState().entries['2026-06-15']!.ai?.reflection).toBe('some reflection');
  });

  it('setReflection does nothing if entry does not exist', () => {
    store.getState().setReflection('2026-06-15', 'some reflection');
    expect(store.getState().entries['2026-06-15']).toBeUndefined();
  });

  it('setAIQuestions updates ai.questions', () => {
    store.getState().upsertEntryText('2026-06-15', 'work', 'task');
    store.getState().setAIQuestions('2026-06-15', ['q1', 'q2']);
    expect(store.getState().entries['2026-06-15']!.ai?.questions).toEqual(['q1', 'q2']);
  });

  it('setQuestionAnswers updates ai.questionAnswers', () => {
    store.getState().upsertEntryText('2026-06-15', 'work', 'task');
    store.getState().setQuestionAnswers('2026-06-15', ['a1', 'a2']);
    expect(store.getState().entries['2026-06-15']!.ai?.questionAnswers).toEqual(['a1', 'a2']);
  });

  it('updateDailyReview creates a new entry if none exists', () => {
    store.getState().updateDailyReview('2026-06-15', { target: 'test target' });
    const entry = store.getState().entries['2026-06-15'];
    expect(entry).toBeDefined();
    expect(entry!.review?.target).toBe('test target');
  });

  it('updateDailyReview updates existing entry review', () => {
    store.getState().upsertEntryText('2026-06-15', 'work', 'task');
    store.getState().updateDailyReview('2026-06-15', { target: 'test target' });
    const entry = store.getState().entries['2026-06-15'];
    expect(entry!.review?.target).toBe('test target');
  });
});
