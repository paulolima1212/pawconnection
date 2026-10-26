import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../shared/presentation/decorators/current-user.decorator';
import {
  ConnectionTypeValue,
  RequestDirection,
} from '../../../shared/domain/types';
import {
  AcceptConnectionRequestUseCase,
  CancelConnectionRequestUseCase,
  CreateConnectionRequestUseCase,
  GetConnectionWithUserUseCase,
  GetFriendshipPrivacyUseCase,
  ListFriendSuggestionsUseCase,
  ListFriendsUseCase,
  ListInboxRequestsUseCase,
  ListMutualFriendsUseCase,
  RejectConnectionRequestUseCase,
  RemoveFriendUseCase,
  UpdateFriendshipPrivacyUseCase,
} from '../application/connections.use-cases';
import {
  CreateConnectionRequestDto,
  UpdateFriendshipPrivacyDto,
} from './connections.dto';

@ApiTags('inbox')
@Controller('inbox')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(
    private readonly listRequests: ListInboxRequestsUseCase,
    private readonly acceptRequest: AcceptConnectionRequestUseCase,
    private readonly rejectRequest: RejectConnectionRequestUseCase,
    private readonly createRequest: CreateConnectionRequestUseCase,
    private readonly connectionWith: GetConnectionWithUserUseCase,
    private readonly cancelRequest: CancelConnectionRequestUseCase,
    private readonly removeFriend: RemoveFriendUseCase,
    private readonly listFriends: ListFriendsUseCase,
    private readonly listMutual: ListMutualFriendsUseCase,
    private readonly suggestions: ListFriendSuggestionsUseCase,
    private readonly getPrivacy: GetFriendshipPrivacyUseCase,
    private readonly updatePrivacy: UpdateFriendshipPrivacyUseCase,
  ) {}

  @Get('connection/:userId')
  connection(
    @CurrentUser() user: AuthUserPayload,
    @Param('userId') userId: string,
  ) {
    return this.connectionWith.execute(user.userId, userId);
  }

  @Post('requests')
  create(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateConnectionRequestDto,
  ) {
    return this.createRequest.execute(
      user.userId,
      dto.recipientId,
      dto.lookingFor,
    );
  }

  @Get('requests')
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['romance', 'friendship', 'request'],
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    enum: ['incoming', 'outgoing'],
  })
  list(
    @CurrentUser() user: AuthUserPayload,
    @Query('type') type?: ConnectionTypeValue,
    @Query('direction') direction?: RequestDirection,
  ) {
    return this.listRequests.execute(user.userId, { type, direction });
  }

  @Post('requests/:id/accept')
  accept(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.acceptRequest.execute(id, user.userId);
  }

  @Post('requests/:id/reject')
  reject(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.rejectRequest.execute(id, user.userId);
  }

  @Post('requests/:id/cancel')
  cancel(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.cancelRequest.execute(id, user.userId);
  }

  @Delete('friends/:userId')
  unfriend(
    @CurrentUser() user: AuthUserPayload,
    @Param('userId') userId: string,
  ) {
    return this.removeFriend.execute(user.userId, userId);
  }

  @Get('friends')
  friends(
    @CurrentUser() user: AuthUserPayload,
    @Query('userId') userId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.listFriends.execute(user.userId, userId || user.userId, {
      cursor,
      limit: limit ? Number(limit) : undefined,
      q,
    });
  }

  @Get('friends/:userId/mutual')
  mutual(
    @CurrentUser() user: AuthUserPayload,
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listMutual.execute(user.userId, userId, {
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('suggestions')
  peopleYouMayKnow(
    @CurrentUser() user: AuthUserPayload,
    @Query('limit') limit?: string,
  ) {
    return this.suggestions.execute(
      user.userId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('privacy')
  privacy(@CurrentUser() user: AuthUserPayload) {
    return this.getPrivacy.execute(user.userId);
  }

  @Patch('privacy')
  savePrivacy(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateFriendshipPrivacyDto,
  ) {
    return this.updatePrivacy.execute(user.userId, dto);
  }
}
