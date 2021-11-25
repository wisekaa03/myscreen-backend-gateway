import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import type { MyscreenJwtPayload } from '@/shared/jwt.payload';
import { UserService } from '@/database/user.service';
import type { UserEntity } from '@/database/user.entity';

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
        expiresIn: configService.get('JWT_ACCESS_EXPIRES'),
      },
    });
  }

  async validate(payload: MyscreenJwtPayload): Promise<UserEntity> {
    const user = await this.userService.findById(payload.sub);

    if (!user) {
      return null;
    }

    return user;
  }
}
