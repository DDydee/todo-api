import { Status } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({
    description: 'Title of the task. Must be at least 3 characters long.',
    minLength: 3,
    example: 'Buy groceries',
  })
  @IsNotEmpty({ message: 'Title is empty' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the task.',
    example: 'Milk, bread, and eggs',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Current status of the task.',
    enum: Status,
    example: Status.DONE,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({
    description: 'Deadline for the task in ISO 8601 format.',
    example: '2025-08-04T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({
    description: 'List of tags associated with the task.',
    example: ['shopping', 'urgent'],
    type: [String],
  })
  @IsOptional()
  todoTag?: string[];
}
