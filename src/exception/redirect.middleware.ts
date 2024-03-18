import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { FileService } from '@/database/file.service';

@Injectable()
export class RedirectMiddleware implements NestMiddleware {
  private logger = new Logger(RedirectMiddleware.name);

  private apiPath: string;

  private frontEndUrl: string;

  constructor(configService: ConfigService, fileService: FileService) {
    this.apiPath = configService.getOrThrow('API_PATH');
    this.frontEndUrl = fileService.frontEndUrl;
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl.startsWith(this.apiPath)) {
      next();
    } else {
      this.logger.debug(`Redirecting to ${this.frontEndUrl}`);
      res.redirect(302, this.frontEndUrl);
    }
  }
}
