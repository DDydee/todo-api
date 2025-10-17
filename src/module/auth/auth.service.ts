import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/signIn.dto';
import { SignUpDto } from './dto/signUp.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async refreshToken(user: any, token: string) {
    const findedUser = await this.userService.findOne(user.email);
    const oldToken = await this.prisma.refreshToken.findUnique({
      where: { userId: user.sub },
      select: { token: true },
    });
    if (!findedUser || !(await bcrypt.compare(token, oldToken!.token))) {
      throw new UnauthorizedException();
    }

    return await this.generateToken(findedUser);
  }

  async generateToken(user: any) {
    const payload = {
      sub: user?.id,
      email: user?.email,
      role: user?.role,
    };
    const access_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_KEY,
      expiresIn: '15m',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_KEY,
      expiresIn: '7d',
    });

    const refreshHash = await bcrypt.hash(refresh_token, 10);

    await this.prisma.refreshToken.upsert({
      where: { userId: user.id },
      create: {
        token: refreshHash,
        userId: payload.sub,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      update: {
        token: refreshHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return {
      access_token,
      refresh_token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.userService.isUserExist({
      email: signInDto.email,
    });

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    const password_hash = await bcrypt.compare(
      signInDto.password,
      user.password_hash
    );

    if (!password_hash) {
      throw new UnauthorizedException("Password don't match");
    }

    return await this.generateToken(user);
  }

  async signUp(signUpDto: SignUpDto) {
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
