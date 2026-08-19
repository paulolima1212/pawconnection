import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CommentContent } from '../domain/value-objects/comment-content.vo';

export class CreateCommentDto {
  @ApiProperty({ minLength: 1, maxLength: CommentContent.MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(CommentContent.MAX_LENGTH)
  content!: string;
}

export class ReplyCommentDto {
  @ApiProperty({ minLength: 1, maxLength: CommentContent.MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(CommentContent.MAX_LENGTH)
  content!: string;
}

export class UpdateCommentDto {
  @ApiProperty({ minLength: 1, maxLength: CommentContent.MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(CommentContent.MAX_LENGTH)
  content!: string;
}

export class ListCommentsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ description: 'Opaque pagination cursor' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ enum: ['newest', 'oldest'], default: 'newest' })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  order?: 'newest' | 'oldest';
}

// --- Response documentation shapes (Swagger only) -------------------------

export class CommentAuthorDto {
  @ApiProperty() id!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() handle!: string;
  @ApiPropertyOptional({ nullable: true }) photoUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) petName?: string | null;
  @ApiPropertyOptional({ nullable: true }) petPhotoUrl?: string | null;
}

export class CommentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() postId!: string;
  @ApiProperty() authorId!: string;
  @ApiPropertyOptional({ nullable: true }) parentCommentId!: string | null;
  @ApiProperty() content!: string;
  @ApiProperty({ enum: ['ACTIVE', 'EDITED', 'DELETED', 'HIDDEN', 'BLOCKED'] })
  status!: string;
  @ApiProperty() edited!: boolean;
  @ApiProperty() deleted!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiProperty() replyCount!: number;
  @ApiPropertyOptional({ type: CommentAuthorDto, nullable: true })
  author!: CommentAuthorDto | null;
}

export class CommentTreeDto extends CommentResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  replies!: CommentResponseDto[];
  @ApiProperty() hasMoreReplies!: boolean;
}

export class CommentTreePageDto {
  @ApiProperty({ type: [CommentTreeDto] })
  items!: CommentTreeDto[];
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}
