import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import type { MyscreenJwtPayload } from '@/utils/jwt.payload';
import { UserService } from '@/database/user.service';
import { UserExtEntity } from '@/database/user-ext.entity';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authService.secretAccessToken,
      signOptions: {
        expiresIn: authService.accessTokenExpires,
      },
    });
  }

  async validate(payload: MyscreenJwtPayload): Promise<UserExtEntity | null> {
    const id = payload.sub;
    if (!id) {
      return null;
    }

    let user = await this.userService.findById(id);
    if (!user) {
      return null;
    }
    user = UserService.userEntityToUser(user);

    return user;
  }
}
