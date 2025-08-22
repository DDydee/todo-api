import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { SignUpDto } from './dto/signUp.dto';
import type { Response } from 'express';
import type { Request } from 'express';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private jwtService: JwtService
  ) {}

  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { refresh_token, access_token, user } =
      await this.authService.signIn(signInDto);
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

  @Post('sign-up')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { refresh_token, access_token, user } =
      await this.authService.signUp(signUpDto);
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

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('REFRESH_INVALID');
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_KEY,
      });
    } catch (error) {
      throw new UnauthorizedException(
        error.name === 'TokenExpiredError'
          ? 'REFRESH_EXPIRED'
          : 'REFRESH_INVALID'
      );
    }

    const { refresh_token, access_token, user } =
      await this.authService.refreshToken(payload, refreshToken);

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
