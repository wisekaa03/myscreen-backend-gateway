import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import type { MyscreenJwtPayload } from '@/utils/jwt.payload';
import { userEntityToUser } from '@/dto/response/user.response';
import { UserService } from '@/database/user.service';
import { UserExtEntity } from '@/database/user-ext.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN'),
      signOptions: {
        expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES', '10min'),
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
    user = userEntityToUser(user);

    return user;
  }
}
