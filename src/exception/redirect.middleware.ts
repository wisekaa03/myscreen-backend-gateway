import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RedirectMiddleware implements NestMiddleware {
  private logger = new Logger(RedirectMiddleware.name);

  private apiPath: string;

  private redirect: string;

  constructor(configService: ConfigService) {
    this.apiPath = configService.get<string>('API_PATH', '/api/v2');
    this.redirect = configService.get<string>(
      'FRONTEND_URL',
      'https://cp.myscreen.ru',
    );
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl.startsWith(this.apiPath)) {
      next();
    } else {
      this.logger.debug(`Redirecting to ${this.redirect}`);
      res.redirect(302, this.redirect);
    }
  }
}
