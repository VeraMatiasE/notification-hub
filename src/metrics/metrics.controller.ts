import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { MetricsService } from './services/metrics.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserMetricsDto } from './dto/user-metrics.dto';
import { PERMISSIONS } from 'src/common/constants/permissions.constants';

@Controller('metrics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Metrics')
@ApiBearerAuth('access-token')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.METRICS_VIEW)
  @ApiOperation({
    summary: 'Get user metrics',
    description: 'Returns usage metrics for all users (admin only)',
  })
  @ApiOkResponse({
    description: 'User metrics retrieved successfully',
    type: UserMetricsDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT',
  })
  async getUsersMetrics(): Promise<UserMetricsDto[]> {
    return await this.metricsService.getUsersMetrics();
  }
}
