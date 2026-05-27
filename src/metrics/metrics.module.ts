import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { MetricsController } from './metrics.controller';
import { UserModule } from '../auth/user.module';
import { MetricsService } from './metrics.service';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}
