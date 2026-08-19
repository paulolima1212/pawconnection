import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { SupabaseService } from '../../../shared/infrastructure/supabase/supabase.service';
import { mapUserToSummary } from '../../../shared/infrastructure/mappers/prisma.mapper';
import { UserSummary } from '../../../shared/domain/types';
import { Comment, CommentState } from '../domain/comment.entity';
import { CommentStatus } from '../domain/comment-status';
import { MAX_REPLY_DEPTH } from '../domain/specifications/comment-rules';
import {
  CommentOrder,
  CommentPage,
  CommentReadModel,
  ICommentRepository,
  ListCommentsOptions,
} from '../domain/repositories/comment.repository';

/** Statuses returned when listing a thread (DELETED kept as a tombstone). */
const LISTABLE_STATUSES: CommentStatus[] = [
  CommentStatus.ACTIVE,
  CommentStatus.EDITED,
  CommentStatus.DELETED,
];

const VISIBLE_COUNT_STATUSES: CommentStatus[] = [
  CommentStatus.ACTIVE,
  CommentStatus.EDITED,
];

type CommentRow = Prisma.CommentGetPayload<{
  include: {
    author: { include: { pet: true } };
    _count: { select: { replies: true } };
  };
}>;

@Injectable()
export class PrismaCommentRepository implements ICommentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  private mapAuthor(author: CommentRow['author']): UserSummary {
    const summary = mapUserToSummary({ ...author, interests: [] } as never);
    return {
      ...summary,
      photoUrl: this.supabase.normalizePublicUrl(summary.photoUrl),
      petPhotoUrl: this.supabase.normalizePublicUrl(summary.petPhotoUrl),
    };
  }

  private toReadModel(row: CommentRow): CommentReadModel {
    return {
      id: row.id,
      postId: row.postId,
      authorId: row.authorId,
      parentCommentId: row.parentCommentId,
      content: row.content,
      status: row.status as CommentStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      author: this.mapAuthor(row.author),
      replyCount: row._count.replies,
    };
  }

  private toState(row: {
    id: string;
    postId: string;
    authorId: string;
    parentCommentId: string | null;
    content: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): CommentState {
    return {
      id: row.id,
      postId: row.postId,
      authorId: row.authorId,
      parentCommentId: row.parentCommentId,
      content: row.content,
      status: row.status as CommentStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }

  async findById(id: string): Promise<Comment | null> {
    const row = await this.prisma.comment.findUnique({ where: { id } });
    return row ? Comment.restore(this.toState(row)) : null;
  }

  async findReadModelById(id: string): Promise<CommentReadModel | null> {
    const row = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: { include: { pet: true } },
        _count: { select: { replies: true } },
      },
    });
    return row ? this.toReadModel(row) : null;
  }

  async create(comment: Comment): Promise<void> {
    const s = comment.toState();
    await this.prisma.comment.create({
      data: {
        id: s.id,
        postId: s.postId,
        authorId: s.authorId,
        parentCommentId: s.parentCommentId,
        content: s.content,
        status: s.status,
        createdAt: s.createdAt,
      },
    });
  }

  async update(comment: Comment): Promise<void> {
    const s = comment.toState();
    await this.prisma.comment.update({
      where: { id: s.id },
      data: {
        content: s.content,
        status: s.status,
        deletedAt: s.deletedAt,
      },
    });
  }

  async getDepth(commentId: string): Promise<number | null> {
    const root = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { parentCommentId: true },
    });
    if (!root) return null;

    let depth = 0;
    let parentId = root.parentCommentId;
    // Bounded walk: structurally a comment can never be its own ancestor
    // (parents are always older), so this terminates; the cap is a safety net.
    while (parentId && depth < MAX_REPLY_DEPTH + 2) {
      depth += 1;
      const parent = await this.prisma.comment.findUnique({
        where: { id: parentId },
        select: { parentCommentId: true },
      });
      parentId = parent?.parentCommentId ?? null;
    }
    return depth;
  }

  private orderByOf(order: CommentOrder): Prisma.CommentOrderByWithRelationInput[] {
    const dir: Prisma.SortOrder = order === 'newest' ? 'desc' : 'asc';
    return [{ createdAt: dir }, { id: dir }];
  }

  private async listPage(
    where: Prisma.CommentWhereInput,
    options: ListCommentsOptions,
  ): Promise<CommentPage> {
    const take = options.limit + 1;
    const rows = await this.prisma.comment.findMany({
      where,
      include: {
        author: { include: { pet: true } },
        _count: { select: { replies: true } },
      },
      orderBy: this.orderByOf(options.order),
      take,
      ...(options.cursor
        ? { cursor: { id: options.cursor }, skip: 1 }
        : {}),
    });

    const hasMore = rows.length > options.limit;
    const items = rows.slice(0, options.limit).map((r) => this.toReadModel(r));
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
    return { items, nextCursor };
  }

  listTopLevel(postId: string, options: ListCommentsOptions): Promise<CommentPage> {
    return this.listPage(
      { postId, parentCommentId: null, status: { in: LISTABLE_STATUSES } },
      options,
    );
  }

  listReplies(
    parentCommentId: string,
    options: ListCommentsOptions,
  ): Promise<CommentPage> {
    return this.listPage(
      { parentCommentId, status: { in: LISTABLE_STATUSES } },
      options,
    );
  }

  async previewRepliesFor(
    parentIds: string[],
    perParent: number,
    order: CommentOrder,
  ): Promise<Map<string, CommentReadModel[]>> {
    const grouped = new Map<string, CommentReadModel[]>();
    if (parentIds.length === 0) return grouped;

    // Single query for all parents; grouping + per-parent slicing happens in
    // memory. Avoids the N+1 of querying replies per top-level comment.
    const rows = await this.prisma.comment.findMany({
      where: {
        parentCommentId: { in: parentIds },
        status: { in: LISTABLE_STATUSES },
      },
      include: {
        author: { include: { pet: true } },
        _count: { select: { replies: true } },
      },
      orderBy: this.orderByOf(order),
      take: parentIds.length * perParent * 4,
    });

    for (const row of rows) {
      const key = row.parentCommentId as string;
      const list = grouped.get(key) ?? [];
      if (list.length < perParent) {
        list.push(this.toReadModel(row));
        grouped.set(key, list);
      }
    }
    return grouped;
  }

  countByPost(postId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { postId, status: { in: VISIBLE_COUNT_STATUSES } },
    });
  }
}
