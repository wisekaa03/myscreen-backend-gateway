import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
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
          callback(
            null,
            this.configService.get<string>('FILES_UPLOAD', 'upload'),
          );
        },
      }),
    };
  }
}
