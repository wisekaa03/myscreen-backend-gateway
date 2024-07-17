import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import type { MyscreenJwtPayload } from '@/utils/jwt.payload';
import { UserService } from '@/database/user.service';
import { AuthService } from './auth.service';
import { UserResponse } from '@/database/user-response.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    const secretOrKey = authService.secretAccessToken;
    const expiresIn = authService.accessTokenExpires;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
      signOptions: {
        expiresIn,
      },
    });
  }

  async validate(payload: MyscreenJwtPayload): Promise<UserResponse | null> {
    const id = payload.sub;
    if (!id) {
      return null;
    }

    const user = await this.userService.findById(id);
    if (!user) {
      return null;
    }

    return user;
  }
}
