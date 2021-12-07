import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';

import { MediaEntity } from './media.entity';
import { FolderService } from './folder.service';

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly folderService: FolderService,
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
  ) {}

  /**
   * Get media files
   *
   * @async
   * @param {MediaGetFilesRequest} body
   * @returns {MediaGetFilesResponse} Результат
   */
  getMediaFiles = async (
    find: FindManyOptions<MediaEntity>,
  ): Promise<[MediaEntity[], number]> =>
    this.mediaRepository.findAndCount(find);
}
