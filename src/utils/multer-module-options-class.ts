import type { Request as ExpressRequest } from 'express';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import 'multer';
import 'debug';
import multerMedia from 'multer-media';

@Injectable()
export class MulterModuleOptionsClass implements MulterOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

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
          file.originalname = Buffer.from(file.originalname, 'ascii').toString(
            'utf8',
          );
          callback(null, this.configService.getOrThrow('FILES_UPLOAD'));
        },
      }),
    };
  }
}
