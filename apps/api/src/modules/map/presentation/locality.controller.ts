import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SearchLocalitiesUseCase } from '../application/search-localities.use-case';
import { SearchLocalitiesQueryDto } from './map.dto';

@ApiTags('map')
@Controller('map')
export class LocalityController {
  constructor(private readonly searchLocalities: SearchLocalitiesUseCase) {}

  @Get('localities')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Suggest a city or neighborhood. The label includes the rest of the place.',
  })
  localities(@Query() query: SearchLocalitiesQueryDto) {
    return this.searchLocalities.execute(query.q);
  }
}
