import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ffprobe, FfprobeData } from 'fluent-ffmpeg';
import { EntityManager, ObjectLiteral, UpdateResult } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import {
  MsvcGatewayUpdate,
  MsvcGatewayFileUpload,
  MsvcGatewayEditorExport,
} from '../interfaces';
import { MSVC_EXCHANGE, MsvcGateway } from '../enums';
import { FileService } from '../database/file.service';
import { UserService } from '../database/user.service';
import { WsStatistics } from '../database/ws.statistics';
import { InjectEntityManager } from '@nestjs/typeorm';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class GatewayService {
  private logger = new Logger(GatewayService.name);

  downloadDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
    private readonly wsStatistics: WsStatistics,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    this.downloadDir = this.configService.getOrThrow('FILES_UPLOAD');
  }

  @RabbitRPC({
    exchange: MSVC_EXCHANGE.GATEWAY,
    routingKey: MsvcGateway.Update,
    queue: MsvcGateway.Update,
  })
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

  @RabbitRPC({
    exchange: MSVC_EXCHANGE.GATEWAY,
    routingKey: MsvcGateway.EditorExportFinished,
    queue: MsvcGateway.EditorExportFinished,
  })
  async editorExportFinished({ playlistId }: MsvcGatewayEditorExport) {
    await this.wsStatistics.onChangePlaylist({ playlistId });
  }

  @RabbitRPC({
    exchange: MSVC_EXCHANGE.GATEWAY,
    routingKey: MsvcGateway.FileUpload,
    queue: MsvcGateway.FileUpload,
  })
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
        info = await new Promise((resolve, reject) =>
          ffprobe(outPath, (error, data) =>
            error ? reject(error) : resolve(data),
          ),
        );
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
