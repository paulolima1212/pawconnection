import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import {
  AuthUserPayload,
  CurrentUser,
} from '../../../shared/presentation/decorators/current-user.decorator';
import {
  ListMapUsersUseCase,
  UpdateMapLocationUseCase,
} from '../application/map.use-cases';
import { MapUserPinDto, UpdateMapLocationDto } from './map.dto';

@ApiTags('map')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('map')
export class MapController {
  constructor(
    private readonly updateLocation: UpdateMapLocationUseCase,
    private readonly listUsers: ListMapUsersUseCase,
  ) {}

  @Put('me/location')
  @ApiOperation({
    summary: 'Update current user map position (heartbeat while app is open)',
  })
  updateMyLocation(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateMapLocationDto,
  ) {
    return this.updateLocation.execute(user.userId, dto.latitude, dto.longitude);
  }

  @Get('users')
  @ApiOperation({
    summary: 'List users visible on the discovery map (last known coordinates)',
  })
  users(@CurrentUser() user: AuthUserPayload): Promise<MapUserPinDto[]> {
    return this.listUsers.execute(user.userId);
  }
}
