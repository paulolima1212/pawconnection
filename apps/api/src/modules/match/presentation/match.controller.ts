import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import {
  CurrentUser,
  AuthUserPayload,
} from '../../../shared/presentation/decorators/current-user.decorator';
import {
  ListMatchCandidatesUseCase,
  PassMatchCandidateUseCase,
  SendWaveUseCase,
} from '../application/match.use-cases';
import { MatchCandidateMapper } from '../application/match.mapper';

@ApiTags('match')
@Controller('match')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchController {
  constructor(
    private readonly listCandidates: ListMatchCandidatesUseCase,
    private readonly passCandidate: PassMatchCandidateUseCase,
    private readonly sendWave: SendWaveUseCase,
    private readonly matchMapper: MatchCandidateMapper,
  ) {}

  @Get('candidates')
  @ApiQuery({ name: 'radiusKm', required: false, type: Number })
  @ApiQuery({ name: 'expandRadius', required: false, type: Boolean })
  candidates(
    @CurrentUser() user: AuthUserPayload,
    @Query('radiusKm') radiusKm?: string,
    @Query('expandRadius') expandRadius?: string,
  ) {
    return this.listCandidates
      .execute(user.userId, {
        radiusKm: radiusKm ? Number(radiusKm) : undefined,
        expandRadius: expandRadius === 'false' ? false : true,
      })
      .then((result) => this.matchMapper.toListResponse(result));
  }

  @Post('candidates/:userId/pass')
  pass(
    @CurrentUser() user: AuthUserPayload,
    @Param('userId') targetId: string,
  ) {
    return this.passCandidate.execute(user.userId, targetId);
  }

  @Post('candidates/:userId/wave')
  wave(
    @CurrentUser() user: AuthUserPayload,
    @Param('userId') targetId: string,
  ) {
    return this.sendWave.execute(user.userId, targetId);
  }
}
