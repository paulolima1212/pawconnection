import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/presentation/jwt-auth.guard';
import {
  AuthUserPayload,
  CurrentUser,
} from '../../../shared/presentation/decorators/current-user.decorator';
import { ListDogFriendlyPlacesUseCase } from '../application/list-dog-friendly-places.use-case';
import {
  ListMapUsersUseCase,
  UpdateMapLocationUseCase,
} from '../application/map.use-cases';
import {
  ListDogFriendlyPlacesQueryDto,
  MapUserPinDto,
  UpdateMapLocationDto,
} from './map.dto';

@ApiTags('map')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('map')
export class MapController {
  constructor(
    private readonly updateLocation: UpdateMapLocationUseCase,
    private readonly listUsers: ListMapUsersUseCase,
    private readonly listPlaces: ListDogFriendlyPlacesUseCase,
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

  @Get('places')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'List nearby dog-friendly places personalized from the viewer profile',
  })
  places(
    @CurrentUser() user: AuthUserPayload,
    @Query() query: ListDogFriendlyPlacesQueryDto,
  ) {
    return this.listPlaces.execute(user.userId, {
      latitude: query.latitude,
      longitude: query.longitude,
      radiusKm: query.radiusKm,
      category: query.category,
    });
  }
}
