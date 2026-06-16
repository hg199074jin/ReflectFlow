import type { GeneratedReport } from '../../lib/schema';
import type { SliceCreator } from './sliceTypes';
import { saveReport, deleteReport as deleteReportFromDB } from '../persistence';

export interface ReportSlice {
  reports: Record<string, GeneratedReport>;
  saveGeneratedReport: (report: GeneratedReport) => Promise<void>;
  deleteGeneratedReport: (reportId: string) => Promise<void>;
}

export const createReportSlice: SliceCreator<ReportSlice> = (set, get) => ({
  reports: {},

  saveGeneratedReport: async (report) => {
    const { reports } = get();
    set({ reports: { ...reports, [report.id]: report } });
    await saveReport(report);
  },

  deleteGeneratedReport: async (reportId) => {
    const { reports } = get();
    const { [reportId]: _, ...rest } = reports;
    set({ reports: rest });
    await deleteReportFromDB(reportId);
  },
});
