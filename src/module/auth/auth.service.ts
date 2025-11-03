import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/signIn.dto';
import { SignUpDto } from './dto/signUp.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Payload } from './interfaces/auth.inteface';
import { User } from '../user/interfaces/users.interface';
import { ConfigService } from '@nestjs/config';
import type { Env } from 'config/dev.config';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService<Env>
  ) {}

  async refreshToken(userPayload: Payload, token: string) {
    const findedUser = await this.userService.findOne(userPayload.sub);
    if (!findedUser) {
      throw new UnauthorizedException('User not found');
    }

    const oldToken = await this.prisma.refreshToken.findUnique({
      where: { userId: userPayload.sub },
      select: { token: true },
    });
    if (!oldToken || !(await bcrypt.compare(token, oldToken.token))) {
      throw new UnauthorizedException();
    }

    return await this.generateToken(findedUser);
  }

  async generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_KEY'),
      expiresIn: '15m',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_KEY'),
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
    const user = await this.userService.findUserByEmail(signInDto.email);

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
    const isUserExist = await this.userService.findUserByEmail(signUpDto.email);

    if (isUserExist) {
      throw new ConflictException('User is already exist');
    }

    let user: User;
    try {
      user = await this.userService.create(signUpDto);
    } catch {
      throw new InternalServerErrorException('Failed to create user');
    }
    return await this.generateToken(user);
  }

  async signOut(refreshToken: string) {
    const jwtRefreshKey = this.configService.get<string>('JWT_REFRESH_KEY');

    try {
      const payload: Payload = await this.jwtService.verify(refreshToken, {
        secret: jwtRefreshKey,
      });
      const date = Math.floor(Date.now() / 1000);
      if (payload.exp < date) {
        throw new Error('Date is expired');
      }

      await this.prisma.refreshToken.deleteMany({
        where: { userId: payload.sub },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid or expired refresh token';

      console.error(message);
      throw new UnauthorizedException(message);
    }
  }
}
