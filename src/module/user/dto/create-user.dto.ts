import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username of the user. Minimum 3 characters.',
    example: 'john_doe',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty({ message: 'Username is empty' })
  @MinLength(3, {
    message:
      'Username is too short. Minimal length is $constraint1 characters, but actual is $value',
  })
  username: string;

  @ApiProperty({
    description: 'Valid email address of the user.',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsNotEmpty({ message: 'Email is empty' })
  email: string;

  @ApiProperty({
    description: 'Password for the account. Minimum 8 characters.',
    example: 'P@ssw0rd123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password min length 8 characters' })
  password: string;
}
