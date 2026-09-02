export const POST_REPORT_READER = Symbol('POST_REPORT_READER');

/**
 * Read port other contexts use to hide publications the viewer reported.
 */
export interface IPostReportReader {
  listHiddenPostIdsForViewer(viewerId: string): Promise<string[]>;
}
