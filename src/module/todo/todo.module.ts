import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';
import type { Env } from '../../../config/dev.config';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [TodoController],
  providers: [TodoService],
  imports: [
    PrismaModule,
    CacheModule.registerAsync({
      useFactory: async (config: ConfigService<Env>) => {
        const redis = new Redis(config.getOrThrow<string>('REDIS_URL'));
        try {
          await redis.ping();
          console.log('Successfully connected to Redis');

          const keyv = new Keyv({
            store: new KeyvRedis(config.getOrThrow<string>('REDIS_URL')),
          });

          return keyv;
        } catch (error) {
          console.error(`Failed to connect to Redis: ${error}`);
          throw new Error('Redis connection failed');
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class TodoModule {}
