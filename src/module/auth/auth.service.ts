import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async signIn(email: string, pass: string) {
    const user = await this.userService.findOne(email);

    const password_hash = await bcrypt.compare(pass, user!.password_hash);

    if (!password_hash) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: user?.id,
      username: user?.username,
      role: user?.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(username: string, email: string, pass: string) {
    const user = await this.userService.create({
      username,
      email,
      password: pass,
    });

    const payload = {
      sub: user?.id,
      user: user?.username,
      role: user?.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
