import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { S3ModuleOptions, S3ModuleOptionsFactory } from 'nestjs-s3';

@Injectable()
export class S3ModuleOptionsClass implements S3ModuleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  async createS3ModuleOptions(): Promise<S3ModuleOptions> {
    return {
      config: {
        endpoint: this.configService.get<string>(
          'AWS_HOST',
          'https://storage.yandexcloud.net',
        ),
        region: this.configService.get<string>('AWS_REGION', 'ru-central1'),
        forcePathStyle: false,
        credentials: {
          accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY') || '',
          secretAccessKey:
            this.configService.get<string>('AWS_SECRET_KEY') || '',
        },
      },
    };
  }
}
