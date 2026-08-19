import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@ApiExcludeController()
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  liveness() {
    return {
      status: 'ok',
      service: 'paw-connection-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ready',
      service: 'paw-connection-api',
      timestamp: new Date().toISOString(),
    };
  }
}
