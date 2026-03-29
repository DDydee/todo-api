import { Module } from '@nestjs/common';
import { TodoService } from './todo.service.js';
import { TodoController } from './todo.controller.js';
import { PrismaModule } from 'src/prisma/prisma.module.js';

@Module({
  controllers: [TodoController],
  providers: [TodoService],
  imports: [PrismaModule],
})
export class TodoModule {}
