import { IsNotEmpty, IsString } from 'class-validator';
import { LoginDto } from './login.dto';

export class RegistretionDto extends LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;
}
