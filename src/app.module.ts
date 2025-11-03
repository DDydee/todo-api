import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './module/user/user.module';
import { TodoModule } from './module/todo/todo.module';
import { AuthModule } from './module/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { configSchema } from '../config/dev.config';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { ConfigService } from '@nestjs/config';
import { Env } from 'config/dev.config';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    TodoModule,
    AuthModule,
    CacheModule.registerAsync({
      isGlobal: true,
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
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const result = configSchema.safeParse(config);
        if (!result.success) {
          console.error('Validation error .env:');
          result.error.issues.forEach((err) => {
            console.error(` - ${err.path.join('.')} -> ${err.message}`);
          });
          process.exit(1);
        }
        return result.data;
      },
    }),
  ],
})
export class AppModule {}
