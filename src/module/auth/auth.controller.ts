import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { SignUpDto } from './dto/signUp.dto';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import type {
  CookieRequest,
  Payload,
  AuthResponse,
} from './interfaces/auth.inteface';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/dev.config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService<Env>
  ) {}

  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return await this.handleAuth<SignInDto>(
      (dto: SignInDto) => this.authService.signIn(dto),
      signInDto,
      res
    );
  }

  @Post('sign-up')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    return await this.handleAuth<SignUpDto>(
      (dto: SignUpDto) => this.authService.signUp(dto),
      signUpDto,
      res
    );
  }

  @Delete('sign-out')
  async signOut(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('REFRESH_INVALID');
    await this.authService.signOut(refreshToken);
    res.clearCookie('refresh_token');
    res.status(200).json({
      message: 'success',
      action: 'clear_tokens',
    });
  }

  @Post('refresh')
  async refresh(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('REFRESH_INVALID');
    let payload: Payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_KEY'),
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('REFRESH_EXPIRED');
      }
      throw new UnauthorizedException('REFRESH_INVALID');
    }

    return await this.handleAuth(
      (payload: Payload, refToken: string) =>
        this.authService.refreshToken(payload, refToken),
      [payload, refreshToken],
      res
    );
  }

  private async handleAuth<T extends SignUpDto | SignInDto>(
    fn: (dto: T | Payload, token?: string) => Promise<AuthResponse>,
    userDto: T | [Payload, string],
    res: Response
  ) {
    const { refresh_token, access_token, user } = Array.isArray(userDto)
      ? await fn(...userDto)
      : await fn(userDto);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      access_token,
      user,
    };
  }
}
