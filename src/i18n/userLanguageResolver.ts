import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { I18nResolver } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { Request as ExpressRequest } from 'express';

import { UserService } from '@/database/user.service';
import { AuthService } from '@/auth/auth.service';

@Injectable()
export class UserLanguageResolver implements I18nResolver {
  private logger = new Logger('UserLanguage');

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async resolve(context: ExecutionContext): Promise<string> {
    let req: ExpressRequest;
    let preferredLanguage: string =
      this.configService.getOrThrow<string>('LANGUAGE_DEFAULT');

    if (context.getType() === 'http') {
      req = context.switchToHttp().getRequest<ExpressRequest>();
      const authorization = req?.headers?.authorization;
      const token = authorization?.match(/[bB]earer (.+)/);
      if (token?.[1]) {
        const payload = await this.authService.jwtVerify(token[1]);
        if (payload?.sub) {
          const user = await this.userService.findOne({
            where: { id: payload.sub },
            select: ['id', 'preferredLanguage'],
            loadEagerRelations: false,
            relations: {},
            fromView: false,
            caseInsensitive: false,
          });
          if (user) {
            preferredLanguage = user.preferredLanguage;
          }
        }
      }
    }

    return preferredLanguage;
  }
}
