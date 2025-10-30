import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './module/user/user.module';
import { TodoModule } from './module/todo/todo.module';
import { AuthModule } from './module/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { configSchema } from '../config/dev.config';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    TodoModule,
    AuthModule,
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
