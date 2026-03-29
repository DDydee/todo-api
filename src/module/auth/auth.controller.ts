import {
  Body,
  Controller,
  Delete,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignInDto } from './dto/signIn.dto.js';
import { SignUpDto } from './dto/signUp.dto.js';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import type { CookieRequest, Payload } from './interfaces/auth.inteface.js';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/dev.config.js';
import { Public } from './decorators/token.decorators.js';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService<Env>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Post('sign-in')
  @Public()
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const resultAuth = await this.authService.signIn(signInDto);
    this.setCookie(res, resultAuth.refresh_token);
    return resultAuth;
  }

  @Post('sign-up')
  @Public()
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const resultAuth = await this.authService.signUp(signUpDto);
    this.setCookie(res, resultAuth.refresh_token);
    return resultAuth;
  }

  @Delete('sign-out')
  async signOut(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) throw new UnauthorizedException('Token is empty');

    const payload: Payload = this.jwtService.decode(accessToken);
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('INVALID_REFRESH_TOKEN');

    await this.authService.signOut(refreshToken);
    const ttl = payload.exp * 1000 - Date.now();
    await this.cacheManager.set(`${accessToken}`, true, ttl);

    res.clearCookie('refresh_token');
    return {
      message: 'success',
      action: 'clear_tokens',
    };
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
    const resultAuth = await this.authService.refreshToken(
      payload,
      refreshToken
    );
    this.setCookie(res, resultAuth.refresh_token);
    return resultAuth;
  }

  private setCookie(res: Response, refToken: string) {
    res.cookie('refresh_token', refToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
