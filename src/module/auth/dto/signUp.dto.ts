import { IsNotEmpty, IsString } from 'class-validator';
import { SignInDto } from './signIn.dto.js';

export class SignUpDto extends SignInDto {
  @IsNotEmpty()
  @IsString()
  username!: string;
}
