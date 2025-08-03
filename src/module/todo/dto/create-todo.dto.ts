import { Status } from "@prisma/client";
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTodoDto {
    @IsNotEmpty()
    @IsString()
    title: string;
    
    @IsOptional()
    @IsString()
    description?: string;
    
    @IsNotEmpty()
    @IsNumber()
    userId: number;        
    
    @IsOptional()
    @IsEnum(Status)
    @ApiPropertyOptional({ enum: Status })
    status?: Status;
    
    @IsOptional()
    @IsDateString()
    deadline?: string;
    
    @IsOptional()
    todoTag?: string[];
}
