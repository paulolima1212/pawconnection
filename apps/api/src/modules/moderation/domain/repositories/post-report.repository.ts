import { PostReport } from '../post-report.entity';

export const POST_REPORT_REPOSITORY = Symbol('POST_REPORT_REPOSITORY');

export interface IPostReportRepository {
  findByReporterAndPost(reporterId: string, postId: string): Promise<PostReport | null>;
  save(report: PostReport): Promise<void>;
}
