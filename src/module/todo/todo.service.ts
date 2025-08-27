import { Inject, Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TodoService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService
  ) {}

  async #isTodoExist(id: number): Promise<Boolean> {
    const todo = await this.prisma.todo.findFirst({ where: { id } });
    return !!todo;
  }

  async create(userId, todoDto: CreateTodoDto) {
    const todo = await this.prisma.todo.create({
      data: {
        title: todoDto.title,
        description: todoDto.description,
        status: todoDto.status,
        deadline: todoDto.deadline,
        userId,
      },
    });

    if (todoDto.todoTag?.length) {
      for (const tagName of todoDto.todoTag) {
        const tag = await this.prisma.tag.upsert({
          where: { tagName },
          update: {},
          create: { tagName },
        });

        await this.prisma.todoTag.create({
          data: { todoId: todo.id, tagId: tag.id },
        });
      }
    }
    return todo;
  }

  async findAll(userId: number) {
    const cacheTodo = await this.cacheManager.get<string>(String(userId));
    if (cacheTodo) {
      console.log(cacheTodo);
      return JSON.parse(cacheTodo);
    }
    const todos = await this.prisma.todo.findMany({ where: { userId } });
    await this.cacheManager.set(String(userId), JSON.stringify(todos));
    return todos;
  }

  async findOne(id: number, userId: number) {
    const isExist = await this.#isTodoExist(id);
    if (!isExist) {
      return 'Todo is not exist';
    }

    return this.prisma.todo.findUnique({
      where: { id, userId },
      select: {
        title: true,
        description: true,
        status: true,
        deadline: true,
        user: { select: { username: true } },
        todoTag: {
          select: { tag: { select: { tagName: true } } },
        },
      },
    });
  }

  async update(id: number, userId, todoDto: UpdateTodoDto) {
    const isExist = await this.#isTodoExist(id);
    if (!isExist) {
      return 'Todo is not exist';
    }

    const todo = await this.prisma.todo.update({
      where: {
        id,
        userId,
      },
      data: {
        title: todoDto.title,
        description: todoDto.deadline,
        deadline: todoDto.deadline,
        status: todoDto.status,
      },
    });

    if (todoDto.todoTag?.length) {
      for (const tagName of todoDto.todoTag) {
        const tag = await this.prisma.tag.upsert({
          where: { tagName },
          update: {},
          create: { tagName },
        });

        await this.prisma.todoTag.upsert({
          where: {
            todoId_tagId: { tagId: tag.id, todoId: id },
          },
          update: {},
          create: { todoId: id, tagId: tag.id },
        });
      }
    }

    return todo;
  }

  async remove(id: number, userId: number) {
    const isExist = await this.#isTodoExist(id);
    if (!isExist) {
      return 'Todo is not exist';
    }

    return this.prisma.todo.delete({ where: { id, userId } });
  }
}
