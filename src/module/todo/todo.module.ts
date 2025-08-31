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
      isGlobal: true,
      useFactory: async () => {
        const redis = new Redis(6370);
        try {
          await redis.ping();
          console.log('Successfully connected to Redis');

          const keyv = new Keyv({
            store: new KeyvRedis('redis://localhost:6370'),
          });

          return [keyv];
        } catch (error) {
          console.error(`Failed to connect to Redis: ${error}`);
          throw new Error('Redis connection failed');
        }
      },
    }),
  ],
})
export class TodoModule {}
