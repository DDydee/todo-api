import { Inject, Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { TodoUserTag } from './inteface/TodoInterface';

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
    await this.cacheManager.del(String(userId));
  }

  async findAll(userId: number) {
    const cacheTodo = await this.cacheManager.get<TodoUserTag[]>(
      String(userId)
    );
    if (cacheTodo !== undefined) {
      return cacheTodo;
    }
    const todos = await this.prisma.todo.findMany({
      where: { userId },
      include: {
        todoTag: {
          select: { tag: { select: { tagName: true } } },
        },
      },
    });
    const formattedTodo = todos.map((todo) => this.#formattedTodo(todo));
    await this.cacheManager.set(
      String(userId),
      JSON.stringify(todos),
      1000 * 60 * 5
    );
    return formattedTodo;
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
    if (!todo) return 'Todo is not exist';
    return this.#formattedTodo(todo);
  }

  #formattedTodo(todo: TodoUserTag) {
    const result = {
      todoTag: todo.todoTag.map((tt) => tt.tag.tagName),
    };

    return result;
  }

  async update(id: number, userId: number, todoDto: UpdateTodoDto) {
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
      return 'Todo is not exist';
    }

    await this.clearTodoCache(userId);

    return this.prisma.todo.delete({ where: { id, userId } });
  }
}
