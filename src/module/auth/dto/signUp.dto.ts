import { IsNotEmpty, IsString } from 'class-validator';
import { SignInDto } from './signIn.dto';

export class SignUpDto extends SignInDto {
  @IsNotEmpty()
  @IsString()
  username: string;
}
