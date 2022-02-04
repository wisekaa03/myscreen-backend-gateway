import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import type { MyscreenJwtPayload } from '@/shared/jwt.payload';
import { UserService } from '@/database/user.service';
import type { UserEntity } from '@/database/user.entity';
import { UserRoleEnum } from '@/enums';

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

  async validate(
    payload: MyscreenJwtPayload,
  ): Promise<{ id: string; role: UserRoleEnum[] } | null> {
    const id = payload.sub;
    if (!id) {
      return null;
    }

    const role = payload.aud;
    if (!role) {
      return null;
    }

    return { id, role };
  }
}
