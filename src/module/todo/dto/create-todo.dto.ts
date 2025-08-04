import { Status } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
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

  @ApiProperty({
    description: 'ID of the user who owns this task.',
    example: 42,
  })
  @IsNotEmpty({ message: 'userId is empty' })
  @IsNumber()
  userId: number;

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
