import { Inject, Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { TodoUserTag } from './inteface/TodoInterface';
import { Status } from '@prisma/client';

@Injectable()
export class TodoService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService
  ) {}

  async #isTodoExist(id: number): Promise<boolean> {
    const todo = await this.prisma.todo.findFirst({ where: { id } });
    return !!todo;
  }

  async create(userId: number, todoDto: CreateTodoDto) {
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

    await this.clearTodoCache(userId);
    return todo;
  }

  async clearTodoCache(userId: number) {
    await this.cacheManager.clear();
  }

  async findAll(
    userId: number,
    tagsArr: string[] | undefined,
    status: Status | undefined = undefined,
    sort: 'desc' | 'asc' = 'desc',
    page: number | undefined
  ) {
    const cacheTodo = await this.cacheManager.get<TodoUserTag>(
      this.genKeyTodoCache(userId, tagsArr, status, sort, page)
    );
    if (cacheTodo !== undefined) {
      return cacheTodo;
    }
    const todos = await this.prisma.todo.findMany({
      where: {
        userId,
        todoTag: { some: { tag: { tagName: { in: tagsArr } } } },
        status,
      },
      orderBy: { createdAt: sort },
      include: {
        todoTag: {
          select: { tag: { select: { tagName: true } } },
        },
      },
      skip: page && page > 0 ? --page * 10 : undefined,
      take: 10,
    });
    const formattedTodo = todos.map((todo) => this.#formattedTags(todo));
    await this.cacheManager.set(
      this.genKeyTodoCache(userId, tagsArr, status, sort, page),
      JSON.stringify(todos),
      1000 * 60 * 3
    );
    return formattedTodo;
  }

  genKeyTodoCache(
    userId: number,
    tags: string[] | undefined,
    status: Status | undefined,
    sort: 'desc' | 'asc',
    page: number | undefined
  ) {
    const pageStr = page ? String(page) : '1';
    const sortStr = sort;
    const statusStr = status ?? 'all';
    let tagsPart = 'noTags';
    if (tags && tags.length > 0) {
      tagsPart = tags.join(',');
    }

    const keyString = `todo:user:${userId}:list:t:${tagsPart}:s:${statusStr}:sort:${sortStr}:p:${pageStr}`;
    return keyString;
  }

  async findOne(id: number, userId: number) {
    const todo = await this.prisma.todo.findUnique({
      where: { id, userId },
      include: {
        user: { select: { username: true } },
        todoTag: {
          select: { tag: { select: { tagName: true } } },
        },
      },
    });
    if (!todo) return { msg: 'Todo is not exist' };
    return this.#formattedTags(todo);
  }

  #formattedTags(todo: TodoUserTag) {
    return {
      ...todo,
      todoTag: todo.todoTag.map((tt) => tt.tag.tagName),
    };
  }

  async update(id: number, userId: number, todoDto: UpdateTodoDto) {
    const isExist = await this.#isTodoExist(id);
    if (!isExist) {
      return { msg: 'Todo is not exist' };
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

    await this.clearTodoCache(userId);

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
      return { msg: 'Todo is not exist' };
    }

    await this.clearTodoCache(userId);

    return this.prisma.todo.delete({ where: { id, userId } });
  }
}
