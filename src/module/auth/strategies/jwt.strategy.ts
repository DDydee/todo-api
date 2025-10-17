import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/module/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: String(process.env.JWT_KEY),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.userService.findOne(+payload.sub);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
