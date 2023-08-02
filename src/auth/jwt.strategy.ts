import { ExtractJwt, Strategy } from 'passport-jwt';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import addDays from 'date-fns/addDays';

import type { MyscreenJwtPayload } from '@/utils/jwt.payload';
import { UserPlanEnum, UserStoreSpaceEnum } from '@/enums';
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

  verify(user: UserExtEntity) {
    if (user.plan === UserPlanEnum.Demo) {
      if (user.createdAt && addDays(user.createdAt, 28) <= new Date()) {
        throw new ForbiddenException(
          'You have a Demo User account. Time to pay.',
        );
      }
      if ((user.storageSpace ?? 0) > UserStoreSpaceEnum.DEMO) {
        throw new ForbiddenException(
          'You have a Demo User account. Time to pay..',
        );
      }
      if ((user.countUsedSpace ?? 0) > UserStoreSpaceEnum.DEMO) {
        throw new ForbiddenException(
          'You have a Demo User account. Time to pay...',
        );
      }
      if ((user.countMonitors ?? 0) > 5) {
        throw new ForbiddenException(
          'You have a Demo User account. Time to pay....',
        );
      }
    } else if (user.plan === UserPlanEnum.Full) {
      if ((user.countUsedSpace ?? 0) > UserStoreSpaceEnum.FULL) {
        throw new ForbiddenException(
          `You have a limited User account to store space: ${user.countUsedSpace} / ${UserStoreSpaceEnum.FULL}`,
        );
      }
    }
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

    this.verify(user);

    return user;
  }
}
