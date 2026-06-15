import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { createReportSlice, type ReportSlice } from '../reportSlice';
import type { GeneratedReport } from '../../../lib/schema';
import 'fake-indexeddb/auto';

function makeReport(overrides: Partial<GeneratedReport> = {}): GeneratedReport {
  return {
    id: 'report-1',
    templateId: 'tpl-1',
    title: 'Test Report',
    period: 'week',
    startDate: '2026-06-09',
    endDate: '2026-06-15',
    content: 'Report content',
    sections: [],
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('reportSlice', () => {
  let store: StoreApi<ReportSlice>;

  beforeEach(() => {
    store = create<ReportSlice>(
      createReportSlice as StateCreator<ReportSlice, [], [], ReportSlice>
    );
  });

  it('saveGeneratedReport adds a report to state', async () => {
    const report = makeReport();
    await store.getState().saveGeneratedReport(report);
    expect(store.getState().reports['report-1']).toEqual(report);
  });

  it('saveGeneratedReport updates an existing report', async () => {
    await store.getState().saveGeneratedReport(makeReport());
    const updated = makeReport({ title: 'Updated Report', content: 'New content' });
    await store.getState().saveGeneratedReport(updated);
    expect(store.getState().reports['report-1']!.title).toBe('Updated Report');
    expect(store.getState().reports['report-1']!.content).toBe('New content');
  });

  it('deleteGeneratedReport removes the report', async () => {
    await store.getState().saveGeneratedReport(makeReport());
    expect(store.getState().reports['report-1']).toBeDefined();
    await store.getState().deleteGeneratedReport('report-1');
    expect(store.getState().reports['report-1']).toBeUndefined();
  });

  it('deleteGeneratedReport does nothing if report does not exist', async () => {
    await store.getState().deleteGeneratedReport('nonexistent');
    expect(store.getState().reports['nonexistent']).toBeUndefined();
  });
});
