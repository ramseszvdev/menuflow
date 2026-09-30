import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AnalyticsService } from './anatytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('restaurants/:restaurantId/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  getDashboardStats(
    @Req() req: Request & { user?: { id?: string } },
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.analyticsService.getDashboardStats(
      String(req.user?.id),
      restaurantId,
    );
  }
}
