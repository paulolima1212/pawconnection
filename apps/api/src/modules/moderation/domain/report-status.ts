export const REPORT_STATUSES = ['pending', 'reviewed', 'dismissed'] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];
