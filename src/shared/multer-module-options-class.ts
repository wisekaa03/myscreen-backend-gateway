import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModuleOptions } from '@nestjs/platform-express';
import { InjectS3, S3 } from 'nestjs-s3';
import s3Storage from 'multer-s3';
import { MediaService } from '@/database/media.service';

const mediaBucketConfig = {
  bucket: 'myscreen-video-editor',
};

@Injectable()
export class MulterModuleOptionsClass {
  constructor(
    private readonly configService: ConfigService,
    private readonly mediaService: MediaService,
    @InjectS3() private readonly s3: S3,
  ) {}

  createMulterOptions(): MulterModuleOptions {
    return {
      storage: s3Storage({
        ...mediaBucketConfig,
        s3: this.s3,

        key: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (error: any, key?: string) => void,
        ) => {
          this.mediaService
            .filename(req, file)
            .then((filename) => cb(null, filename));
        },

        contentType: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: (
            error: any,
            mime?: string,
            stream?: NodeJS.ReadableStream,
          ) => void,
        ) => {
          this.mediaService
            .contentType(req, file)
            .then((mime) => cb(null, mime));
        },
      }),
    };
  }
}
