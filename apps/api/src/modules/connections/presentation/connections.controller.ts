import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
  CreateConnectionRequestUseCase,
  ListInboxRequestsUseCase,
  RejectConnectionRequestUseCase,
} from '../application/connections.use-cases';
import { CreateConnectionRequestDto } from './connections.dto';

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
  ) {}

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
  @ApiQuery({ name: 'type', required: false, enum: ['romance', 'friendship', 'request'] })
  @ApiQuery({ name: 'direction', required: false, enum: ['incoming', 'outgoing'] })
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
}
