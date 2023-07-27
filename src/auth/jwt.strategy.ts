import { ExtractJwt, Strategy } from 'passport-jwt';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import addMonths from 'date-fns/addMonths';

import type { MyscreenJwtPayload } from '@/utils/jwt.payload';
import { UserStoreSpaceEnum } from '@/enums/store-space.enum';
import { userEntityToUser } from '@/dto/response/user.response';
import { UserService } from '@/database/user.service';
import { UserExtEntity } from '@/database/user.view.entity';

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

    if (user.isDemoUser) {
      if (user.createdAt && addMonths(user.createdAt, 1) <= new Date()) {
        throw new ForbiddenException(
          'You have a Demo User account. Time to pay.',
        );
      }
      if ((user.storageSpace || 0) > UserStoreSpaceEnum.DEMO) {
        throw new ForbiddenException(
          'You have a Demo User account. Time to pay..',
        );
      }
      if ((user.countUsedSpace || 0) > UserStoreSpaceEnum.DEMO) {
        throw new ForbiddenException(
          'You have a Demo User account. Time to pay...',
        );
      }
    }

    return user;
  }
}
