import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegistretionDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async generateToken(user: any) {
    const payload = {
      sub: user?.id,
      email: user?.email,
      role: user?.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async signIn(signInDto: LoginDto) {
    const isUserExist = await this.userService.isUserExist({
      email: signInDto.email,
    });

    if (!isUserExist) {
      throw new UnauthorizedException('User does not exist');
    }

    const user = await this.userService.findOne(signInDto.email);

    const password_hash = await bcrypt.compare(
      signInDto.password,
      user!.password_hash
    );

    if (!password_hash) {
      throw new UnauthorizedException("Password don't match");
    }

    return await this.generateToken(user);
  }

  async signUp(signUpDto: RegistretionDto) {
    const isUserExist = await this.userService.isUserExist({
      email: signUpDto.email,
    });

    if (isUserExist) {
      throw new ConflictException('User is already exist');
    }

    const user = await this.userService.create(signUpDto);

    return await this.generateToken(user);
  }
}
