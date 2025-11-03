import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Env } from 'config/dev.config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/module/user/user.service';
import { Payload } from '../interfaces/auth.inteface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    private configService: ConfigService<Env>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_KEY'),
    });
  }

  async validate(payload: Payload) {
    const user = await this.userService.findOne(+payload.sub);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: payload.exp,
    };
  }
}
