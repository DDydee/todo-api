import { Injectable } from '@nestjs/common';
import type { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from './generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;
  constructor(private configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.get('DATABASE_URL'),
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
    this.pool = pool;
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
