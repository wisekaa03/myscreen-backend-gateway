import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { S3ModuleOptions, S3ModuleOptionsFactory } from 'nestjs-s3-aws';

@Injectable()
export class S3ModuleOptionsClass implements S3ModuleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  async createS3ModuleOptions(): Promise<S3ModuleOptions> {
    return {
      config: {
        endpoint: this.configService.getOrThrow('AWS_HOST'),
        region: this.configService.getOrThrow('AWS_REGION'),
        forcePathStyle: false,
        credentials: {
          accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY'),
          secretAccessKey: this.configService.getOrThrow('AWS_SECRET_KEY'),
        },
      },
    };
  }
}
