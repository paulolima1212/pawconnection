import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MessageType } from '../domain/message-type';

export class CreateConversationDto {
  @ApiProperty({ description: 'Other participant user id' })
  @IsString()
  @MinLength(1)
  participantUserId!: string;
}

export class CreateConversationByHandleDto {
  @ApiProperty({ example: 'sarah' })
  @IsString()
  @MinLength(1)
  handle!: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional({ enum: MessageType })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ description: 'Client idempotency key' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientMessageId?: string;

  @ApiPropertyOptional({ description: 'Message id being replied to' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  replyToMessageId?: string;
}

export class ToggleMessageReactionDto {
  @ApiProperty({ example: '❤️' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  emoji!: string;
}

export class UpdateMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}

export class ListMessagesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
