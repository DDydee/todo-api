import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';

@Module({
  controllers: [TodoController],
  providers: [TodoService],
  imports: [
    PrismaModule,
    CacheModule.registerAsync({
      useFactory: async () => {
        const redis = new Redis(process.env.REDIS_URL || 'redis://todo-redis:6379');
        try {
          await redis.ping();
          console.log('Successfully connected to Redis');

          const keyv = new Keyv({
            store: new KeyvRedis(process.env.REDIS_URL),
          });

          return keyv;
        } catch (error) {
          console.error(`Failed to connect to Redis: ${error}`);
          throw new Error('Redis connection failed');
        }
      },
    }),
  ],
})
export class TodoModule {}
