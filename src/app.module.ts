import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { UserModule } from './module/user/user.module.js';
import { TodoModule } from './module/todo/todo.module.js';
import { AuthModule } from './module/auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { configSchema } from './config/dev.config.js';
import { CacheModule } from './common/cache/cache.module.js';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    TodoModule,
    AuthModule,
    CacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
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
