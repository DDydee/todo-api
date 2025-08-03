import { PartialType } from '@nestjs/swagger';
import { CreateTodoDto } from './create-todo.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateTodoDto extends PartialType(CreateTodoDto) {}
