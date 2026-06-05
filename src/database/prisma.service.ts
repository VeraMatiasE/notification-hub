import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(PrismaService.name, { timestamp: true });

  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter });
  }
  async onApplicationBootstrap() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;

      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error(
        'Database connection failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}
