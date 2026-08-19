import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { AppConnectionIntent } from '../../../shared/domain/types';

export class CreateConnectionRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  recipientId!: string;

  @ApiProperty({
    enum: AppConnectionIntent,
    example: AppConnectionIntent.Friendship,
  })
  @IsEnum(AppConnectionIntent)
  lookingFor!: AppConnectionIntent;
}
