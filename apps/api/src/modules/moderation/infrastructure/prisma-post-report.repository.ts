import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { PostReport } from '../domain/post-report.entity';
import { IPostReportRepository } from '../domain/repositories/post-report.repository';
import { IPostReportReader } from '../domain/ports/post-report-reader.port';
import { ReportReason } from '../domain/report-reason';
import { ReportStatus } from '../domain/report-status';

@Injectable()
export class PrismaPostReportRepository implements IPostReportRepository, IPostReportReader {
  constructor(private readonly prisma: PrismaService) {}

  async findByReporterAndPost(reporterId: string, postId: string): Promise<PostReport | null> {
    const row = await this.prisma.postReport.findUnique({
      where: { reporterId_postId: { reporterId, postId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(report: PostReport): Promise<void> {
    const state = report.toState();
    await this.prisma.postReport.create({
      data: {
        id: state.id,
        reporterId: state.reporterId,
        postId: state.postId,
        reason: state.reason,
        details: state.details,
        status: state.status,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
      },
    });
  }

  async listPostIdsByReporter(reporterId: string): Promise<string[]> {
    return this.listHiddenPostIdsForViewer(reporterId);
  }

  async listHiddenPostIdsForViewer(viewerId: string): Promise<string[]> {
    const rows = await this.prisma.postReport.findMany({
      where: { reporterId: viewerId },
      select: { postId: true },
    });
    return rows.map((row) => row.postId);
  }

  private toDomain(row: {
    id: string;
    reporterId: string;
    postId: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    post?: { authorId: string };
  }): PostReport {
    return PostReport.restore({
      id: row.id,
      reporterId: row.reporterId,
      postId: row.postId,
      postAuthorId: row.post?.authorId ?? '',
      reason: row.reason as ReportReason,
      details: row.details,
      status: row.status as ReportStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
