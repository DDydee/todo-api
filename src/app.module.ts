import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './module/user/user.module';
import { TodoModule } from './module/todo/todo.module';

@Module({
  imports: [PrismaModule, UserModule, TodoModule]
})
export class AppModule {}
