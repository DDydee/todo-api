import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Env } from 'config/dev.config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService<Env>) => {
        const redisCache = new KeyvRedis(
          config.getOrThrow<string>('REDIS_URL')
        );
        console.log('Reddis is connected');
        return {
          stores: [redisCache],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class CacheModule {}
