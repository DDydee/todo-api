import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

type RequestWithUser = Request & { user: { id: string } };

@ApiTags('todo')
@UseGuards(AuthGuard('jwt'))
@Controller('todo')
export class TodoController {
  constructor(private todoService: TodoService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(+req.user.id, createTodoDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.todoService.findAll(+req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.todoService.findOne(+id, +req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @Req() req: RequestWithUser
  ) {
    return this.todoService.update(+id, +req.user.id, updateTodoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.todoService.remove(+id, +req.user.id);
  }
}
