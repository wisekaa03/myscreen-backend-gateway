import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import multerMedia from 'multer-media';

import { MediaService } from '@/database/media.service';

@Injectable()
export class MulterModuleOptionsClass implements MulterOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly mediaService: MediaService,
  ) {}

  async createMulterOptions(): Promise<MulterModuleOptions> {
    return {
      storage: multerMedia({
        algorithm: 'md5',
        algorithmEncoding: 'hex',
        destination: (
          req: ExpressRequest,
          file: Express.Multer.File,
          callback: (error: Error | null, path: string) => void,
        ) => {
          callback(null, this.configService.get('FILES_UPLOAD', 'upload'));
        },
      }),
    };
  }
}
