import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ffprobe, FfprobeData } from 'media-probe';
import { EntityManager, ObjectLiteral, UpdateResult } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { MsvcGatewayUpdate, MsvcGatewayFileUpload } from './interfaces';
import { MsvcGateway } from './enums';
import { FileService } from './database/file.service';
import { UserService } from './database/user.service';

@Controller()
export class RmqController {
  private logger = new Logger(RmqController.name);

  downloadDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
    private readonly entityManager: EntityManager,
  ) {
    this.downloadDir = this.configService.getOrThrow('FILES_UPLOAD');
  }

  @MessagePattern(MsvcGateway.Update)
  async update<Entity extends ObjectLiteral>({
    entity,
    criteria,
    column,
  }: MsvcGatewayUpdate<Entity>): Promise<UpdateResult | undefined> {
    try {
      const entityManager = this.entityManager.getRepository(entity);
      return entityManager.update(criteria, column);
    } catch (error: any) {
      this.logger.error(error);
    }
  }

  @MessagePattern(MsvcGateway.FileUpload)
  async fileUpload({
    userId,
    folderId,
    name: originalname,
    mimetype,
    info: _info,
    buffer,
  }: MsvcGatewayFileUpload) {
    try {
      const user = await this.userService.findOne({
        where: { id: userId },
        select: ['id', 'storageSpace'],
        loadEagerRelations: false,
        relations: {},
        caseInsensitive: true,
      });
      if (!user) {
        throw new Error(`User id not found: ${userId}`);
      }
      const fileBuffer = Buffer.from(buffer);
      const outPath = path.join(this.downloadDir, originalname);
      let info: FfprobeData;
      if (!_info) {
        await writeFile(outPath, fileBuffer);
        info = await ffprobe(outPath, {
          showFormat: true,
          showStreams: true,
          showFrames: false,
          showPackets: false,
          showPrograms: false,
          countFrames: false,
          countPackets: false,
        });
      } else {
        info = JSON.parse(_info);
      }

      return this.fileService.upload({
        userId,
        storageSpace: user.storageSpace,
        folderId,
        originalname,
        mimetype,
        info,
        files: fileBuffer,
      });
    } catch (reason: any) {
      this.logger.error(reason);
    }
  }
}
