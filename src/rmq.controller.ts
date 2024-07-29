import { writeFile } from 'node:fs/promises';
import { ffprobe, FfprobeData } from 'media-probe';
import { ConfigService } from '@nestjs/config';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import path from 'node:path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  MsvcGatewayUpdate,
  MsvcGatewayFileUpload,
  MsvcGatewayEditorFile,
} from './interfaces';
import { BidStatus, MsvcGateway, RenderingStatus } from './enums';
import { FileService } from './database/file.service';
import { UserService } from './database/user.service';
import { PlaylistEntity } from './database/playlist.entity';
import { BidEntity } from './database/bid.entity';
import { EditorService } from './database/editor.service';
import { EditorEntity } from './database/editor.entity';

@Controller()
export class RmqController {
  private logger = new Logger(RmqController.name);

  downloadDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
    private readonly editorService: EditorService,
    @InjectRepository(PlaylistEntity)
    private readonly playlistRepository: Repository<PlaylistEntity>,
    @InjectRepository(BidEntity)
    private readonly bidRepository: Repository<BidEntity>,
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
  ) {
    this.downloadDir = this.configService.getOrThrow('FILE_UPLOAD');
  }

  @MessagePattern(MsvcGateway.Update)
  async update({ entity, id, column, json }: MsvcGatewayUpdate) {
    return;
  }

  @MessagePattern(MsvcGateway.EditorFile)
  async editorFile({ editorId, playlistId, ...param }: MsvcGatewayEditorFile) {
    const files = await this.fileUpload(param);
    if (!files) {
      return;
    }

    await this.editorRepository.update(editorId, {
      renderingStatus: RenderingStatus.Ready,
      renderedFile: files[0],
      renderingPercent: 100,
      renderingError: null,
    });

    // Для SCALING, но может быть еще для чего-то
    if (playlistId) {
      const playlist = await this.playlistRepository.findOne({
        where: { id: playlistId },
        loadEagerRelations: false,
        relations: { editors: true },
      });
      if (playlist) {
        // обновляем плэйлист
        await this.playlistRepository.update(playlist.id, {
          files,
        });
        if (playlist.editors) {
          const editors = playlist.editors.filter(
            (e) => e.renderingStatus === RenderingStatus.Ready,
          );
          if (editors.length === playlist.editors.length) {
            const bid = await this.bidRepository.find({
              where: { playlistId: playlist.id },
            });
            const bidIds = new Set<string>(...bid.map((r) => r.id));
            bidIds.forEach((bidId) => {
              this.bidRepository.update(bidId, {
                status: BidStatus.OK,
              });
            });
          }
        } else {
          this.logger.error(
            `Editors not found: editorId="${editorId}" / playlistId="${playlist.id}"`,
          );
        }
      } else {
        this.logger.error(`Playlist not found: playlistId="${playlistId}"`);
      }
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
      const user = await this.userService.findById(userId);
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
        user,
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
