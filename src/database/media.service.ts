import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Transaction,
  TransactionRepository,
  FindConditions,
  DeleteResult,
} from 'typeorm';

import {
  BadRequestError,
  MediaGetFilesResponse,
  LimitRequest,
  Status,
} from '@/dto';
import { MediaEntity } from './media.entity';
import { MediaGetFilesRequest } from '../dto/request/media-get-files.request';

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    private readonly configService: ConfigService,
  ) {}

  async getMedia(body: MediaGetFilesRequest): Promise<MediaGetFilesResponse> {
    return {
      status: Status.Success,
      count: 1,
      data: [
        {
          name: body.scope.order.name,
        } as MediaEntity,
      ],
    };
  }
}
