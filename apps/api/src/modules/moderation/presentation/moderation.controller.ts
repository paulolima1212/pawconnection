import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import {
  AuthUserPayload,
  CurrentUser,
} from '../../../shared/presentation/decorators/current-user.decorator';
import { CorrelationId } from '../../../shared/observability/correlation-id.decorator';
import {
  BlockUserUseCase,
  ListBlockedUsersUseCase,
  ModerationRequestContext,
  ReportPostUseCase,
  UnblockUserUseCase,
} from '../application/moderation.use-cases';
import { ReportPostDto } from './moderation.dto';

function ctx(user: AuthUserPayload, correlationId?: string): ModerationRequestContext {
  return { userId: user.userId, correlationId };
}

@ApiTags('moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ModerationController {
  constructor(
    private readonly reportPost: ReportPostUseCase,
    private readonly blockUser: BlockUserUseCase,
    private readonly unblockUser: UnblockUserUseCase,
    private readonly listBlocked: ListBlockedUsersUseCase,
  ) {}

  @Post('feed/posts/:postId/report')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Report a publication for review' })
  report(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('postId') postId: string,
    @Body() dto: ReportPostDto,
  ) {
    return this.reportPost.execute(
      { postId, reason: dto.reason, details: dto.details },
      ctx(user, correlationId),
    );
  }

  @Get('blocks')
  @SkipThrottle()
  @ApiOperation({ summary: 'List users you have blocked' })
  list(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
  ) {
    return this.listBlocked.execute(ctx(user, correlationId));
  }

  @Post('users/:userId/block')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Block a user from access, visibility, and interaction' })
  block(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('userId') userId: string,
  ) {
    return this.blockUser.execute(userId, ctx(user, correlationId));
  }

  @Delete('users/:userId/block')
  @SkipThrottle()
  @ApiOperation({ summary: 'Unblock a user' })
  unblock(
    @CurrentUser() user: AuthUserPayload,
    @CorrelationId() correlationId: string,
    @Param('userId') userId: string,
  ) {
    return this.unblockUser.execute(userId, ctx(user, correlationId));
  }
}
