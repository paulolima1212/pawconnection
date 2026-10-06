import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import {
  AppConnectionIntent,
  FriendRequestPolicyValue,
  FriendsListVisibilityValue,
  PostVisibilityValue,
} from '../../../shared/domain/types';

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

export class UpdateFriendshipPrivacyDto {
  @ApiPropertyOptional({ enum: ['everyone', 'friends_of_friends', 'nobody'] })
  @IsOptional()
  @IsEnum(['everyone', 'friends_of_friends', 'nobody'])
  friendRequestPolicy?: FriendRequestPolicyValue;

  @ApiPropertyOptional({ enum: ['everyone', 'friends', 'only_me'] })
  @IsOptional()
  @IsEnum(['everyone', 'friends', 'only_me'])
  friendsListVisibility?: FriendsListVisibilityValue;

  @ApiPropertyOptional({ enum: ['public', 'friends', 'private'] })
  @IsOptional()
  @IsEnum(['public', 'friends', 'private'])
  defaultPostVisibility?: PostVisibilityValue;
}
