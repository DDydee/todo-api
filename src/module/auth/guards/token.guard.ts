import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class TokenGuards extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const result = await super.canActivate(context);
    if (!result) return false;

    const accessToken = req.headers.authorization?.split(' ')[1];
    const isTokenBlacklisted = await this.cacheManager.get(`${accessToken}`);
    if (isTokenBlacklisted)
      throw new UnauthorizedException('Token at the blacklist');

    return true;
  }
}
