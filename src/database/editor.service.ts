import dayjsDuration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, DeleteResult, Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';

import { I18nPath } from '@/i18n';
import { BadRequestError, NotAcceptableError, NotFoundError } from '@/errors';
import {
  MonitorMultiple,
  MonitorOrientation,
  RenderingStatus,
  MICROSERVICE_MYSCREEN,
  MsvcEditor,
} from '@/enums';
import {
  FindManyOptionsExt,
  FindOneOptionsExt,
  MonitorGroupWithPlaylist,
  MsvcEditorExport,
} from '@/interfaces';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';
import { FileService } from '@/database/file.service';
import { FolderService } from './folder.service';
import { BidEntity } from './bid.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';

dayjs.extend(dayjsDuration);

@Injectable()
export class EditorService {
  private logger = new Logger(EditorService.name);

  constructor(
    private readonly folderService: FolderService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
    @InjectRepository(EditorLayerEntity)
    private readonly editorLayerRepository: Repository<EditorLayerEntity>,
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
    @InjectRepository(PlaylistEntity)
    private readonly playlistRepository: Repository<PlaylistEntity>,
    @Inject(MICROSERVICE_MYSCREEN.EDITOR)
    private readonly editorMsvc: ClientProxy,
  ) {}

  async find({
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<EditorEntity>): Promise<EditorEntity[]> {
    const conditional = TypeOrmFind.findParams(EditorEntity, find);
    if (!find.relations) {
      conditional.relations = ['videoLayers', 'audioLayers', 'renderedFile'];
    }
    return caseInsensitive
      ? TypeOrmFind.findCI(this.editorRepository, conditional)
      : this.editorRepository.find(conditional);
  }

  async findAndCount({
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<EditorEntity>): Promise<[EditorEntity[], number]> {
    const conditional = TypeOrmFind.findParams(EditorEntity, find);
    if (!find.relations) {
      conditional.relations = ['videoLayers', 'audioLayers', 'renderedFile'];
    }
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.editorRepository, conditional)
      : this.editorRepository.findAndCount(conditional);
  }

  async findOne({
    ...find
  }: FindOneOptionsExt<EditorEntity>): Promise<EditorEntity | null> {
    return find.relations === undefined
      ? this.editorRepository.findOne(
          TypeOrmFind.findParams(EditorEntity, find),
        )
      : this.editorRepository.findOne({
          relations: {
            videoLayers: true,
            audioLayers: true,
            renderedFile: true,
          },
          ...TypeOrmFind.findParams(EditorEntity, find),
        });
  }

  async create(insert: Partial<EditorEntity>): Promise<EditorEntity> {
    return this.editorRepository.save(this.editorRepository.create(insert));
  }

  async update(
    id: string,
    insert: Partial<EditorEntity>,
  ): Promise<EditorEntity> {
    const updated = await this.editorRepository.update(id, insert);
    if (!updated.affected) {
      throw new NotAcceptableError(`Editor with this '${id}' not found`);
    }

    const editor = await this.findOne({ where: { id } });
    if (!editor) {
      throw new NotFoundError(`Editor with this '${id}' not found`);
    }

    return editor;
  }

  async delete(userId: string, editor: EditorEntity): Promise<DeleteResult> {
    return this.editorRepository.delete({
      id: editor.id,
      userId,
    });
  }

  async findLayer({
    ...find
  }: FindManyOptionsExt<EditorLayerEntity>): Promise<
    EditorLayerEntity[] | undefined
  > {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['video', 'audio', 'file'];
    }
    if (!find.order) {
      conditional.order = { index: 'ASC', start: 'ASC' };
    }
    return this.editorLayerRepository.find(conditional);
  }

  async findOneLayer({
    ...find
  }: FindOneOptionsExt<EditorLayerEntity>): Promise<EditorLayerEntity | null> {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['video', 'audio', 'file'];
    }
    if (!find.order) {
      conditional.order = { index: 'ASC', start: 'ASC' };
    }
    return this.editorLayerRepository.findOne(conditional);
  }

  /**
   * Create layer
   * @async
   * @param {string} userId User ID
   * @param {number} editorId Editor ID
   * @param {EditorLayerEntity} update Editor layer entity
   * @returns {EditorLayerEntity | undefined} Result
   */
  async createLayer(
    userId: string,
    editorId: string,
    update: Partial<EditorLayerEntity>,
  ): Promise<EditorLayerEntity> {
    const updatedQuery: DeepPartial<EditorLayerEntity> = { ...update };

    if (updatedQuery.fileId === undefined) {
      throw new BadRequestError<I18nPath>('error.bid.file_must_exists');
    }
    if (updatedQuery.duration === undefined) {
      if (updatedQuery.file === undefined) {
        throw new BadRequestError<I18nPath>('error.bid.file_must_exists');
      }
      updatedQuery.duration = updatedQuery.file.duration;
    }
    if (updatedQuery.index === undefined) {
      const editor = await this.editorRepository.findOneOrFail({
        where: { id: editorId },
        loadEagerRelations: false,
        relations: { videoLayers: true },
      });
      updatedQuery.index = editor.videoLayers.length;
    }
    if (updatedQuery.cutFrom === undefined) {
      updatedQuery.cutFrom = 0;
    }
    if (updatedQuery.cutTo === undefined) {
      updatedQuery.cutTo = updatedQuery.duration ?? 0;
    }
    if (updatedQuery.cutFrom > updatedQuery.cutTo) {
      throw new BadRequestError('cutFrom must be less than cutTo');
    }
    if (updatedQuery.duration !== updatedQuery.cutTo - updatedQuery.cutFrom) {
      throw new BadRequestError('Duration must be cutTo - cutFrom');
    }

    const layer = await this.editorLayerRepository.save(
      this.editorLayerRepository.create(updatedQuery),
    );

    await this.moveIndex(editorId, layer.id, updatedQuery.index);

    return layer;
  }

  /**
   * Update layer
   * @async
   * @param {string} userId User ID
   * @param {number} editorId Editor ID
   * @param {EditorLayerEntity} layer Editor layer entity
   * @param {Partial<EditorLayerEntity>} update Update editor layer
   * @returns {EditorLayerEntity | undefined} Result
   */
  async updateLayer(
    userId: string,
    editorId: string,
    layer: EditorLayerEntity,
    update: Partial<EditorLayerEntity>,
  ): Promise<EditorLayerEntity | null> {
    await this.editorLayerRepository.update(layer.id, update);

    if (update.index !== undefined) {
      await this.moveIndex(editorId, layer.id, update.index);
    } else if (update.duration !== undefined) {
      await this.moveIndex(editorId, layer.id, layer.index);
    }

    return this.editorLayerRepository.findOne({
      relations: ['file'],
      where: {
        id: layer.id,
      },
    });
  }

  /**
   * Delete layer
   * @async
   * @param {string} userId User ID
   * @param {EditorEntity} editorId Editor ID
   * @param {EditorLayerEntity} editorLayerId Editor layer entity
   * @returns {DeleteResult} Result
   */
  async deleteLayer(
    editorId: string,
    editorLayerId: string,
  ): Promise<DeleteResult> {
    const result = await this.editorLayerRepository.delete(editorLayerId);

    await this.correctLayers(editorId);

    return result;
  }

  private calcDuration = (layer: Partial<EditorLayerEntity>): number => {
    if (layer.cutTo !== undefined && layer.cutFrom !== undefined) {
      return layer.cutTo - layer.cutFrom;
    }
    return layer.duration ?? layer.file?.duration ?? 0;
  };

  private calcTotalDuration = (video: Partial<EditorLayerEntity>[]): number =>
    video.reduce((duration, layer) => duration + this.calcDuration(layer), 0);

  async partitionMonitors({
    bid,
  }: {
    bid: BidEntity;
  }): Promise<MonitorGroupWithPlaylist[] | null> {
    const { playlist, userId } = bid;
    const { multiple, groupMonitors } = bid.monitor;
    if (!groupMonitors) {
      return null;
    }
    if (multiple !== MonitorMultiple.SCALING) {
      const monitorMultipleWithPlaylist = groupMonitors.reduce((acc, item) => {
        acc.push({
          ...item,
          playlist,
        });
        return acc;
      }, [] as MonitorGroupWithPlaylist[]);

      return monitorMultipleWithPlaylist;
    }

    const minRow = Math.min(...groupMonitors.map((m) => m.row));
    const minCol = Math.min(...groupMonitors.map((m) => m.col));
    const widthSum = groupMonitors
      .filter((m) => m.row === minRow)
      .reduce(
        (acc, { monitor: itemMonitor }) =>
          itemMonitor.orientation === MonitorOrientation.Horizontal
            ? acc + itemMonitor.width
            : acc + itemMonitor.height,
        0,
      );
    const heightSum = groupMonitors
      .filter((m) => m.col === minCol)
      .reduce(
        (acc, { monitor: itemMonitor }) =>
          itemMonitor.orientation === MonitorOrientation.Horizontal
            ? acc + itemMonitor.height
            : acc + itemMonitor.width,
        0,
      );

    // делим ее на количество мониторов
    const widthMonitor = widthSum / groupMonitors.length;
    const heightMonitor = heightSum / groupMonitors.length;

    const { files } = bid.playlist;

    const monitorPlaylistsPromise = groupMonitors.map(async (groupMonitor) => {
      const { name: monitorName, id: monitorId } = groupMonitor.monitor;
      // создаем плэйлист
      const _playlist = await this.playlistRepository.save(
        this.playlistRepository.create({
          name: `Scaling monitor "${monitorName}": #${monitorId}`,
          description: `Scaling monitor "${monitorName}": #${monitorId}`,
          userId,
          monitors: [],
          hide: true,
        }),
      );
      const { id: playlistId } = _playlist;
      // добавляем в плэйлист монитор
      await this.monitorRepository.update(monitorId, {
        playlistId,
      });
      // создаем редакторы
      const editorsPromise = files.map(async (file) => {
        const editor = await this.create({
          name: `Automatic playlist: ${playlist.name}. Monitor#${monitorId}. File#${file.id}`,
          userId,
          width: widthMonitor,
          height: heightMonitor,
          fps: 30,
          keepSourceAudio: true,
          totalDuration: 0,
          renderingStatus: RenderingStatus.Initial,
          renderingPercent: null,
          renderingError: null,
          renderedFile: null,
          playlistId,
        });
        // и добавляем в редактор видео-слой с файлом
        await this.createLayer(userId, editor.id, {
          index: 1,
          cutFrom: 0,
          cutTo: file.duration,

          // TODO: Сделать разбиение по мониторам
          cropX: 0,
          cropY: 0,
          cropW: 10,
          cropH: 10,

          duration: file.duration,
          mixVolume: 1,

          file,
          fileId: file.id,
        });

        return editor;
      });
      await Promise.all(editorsPromise);

      return {
        ...groupMonitor,
        playlist: _playlist,
      };
    });
    const monitorPlaylists = await Promise.all(monitorPlaylistsPromise);

    setTimeout(async () => {
      // Запустить рендеринг
      const playlistsPromise = monitorPlaylists.map(async (item) => {
        const editors = await this.editorRepository.find({
          where: { playlistId: item.playlist.id },
          loadEagerRelations: false,
          relations: {},
        });
        const editorsPromise = editors.map(async (editor) => {
          await this.export({
            id: editor.id,
            rerender: true,
            // TODO: customOutputArgs
          });
        });
        await Promise.all(editorsPromise);
      });
      await Promise.all(playlistsPromise);
    }, 0);

    return monitorPlaylists;
  }

  /**
   * Start Export creation
   * @async
   * @param {UserEntity} user The user
   * @param {string} id Editor ID
   * @param {boolean} rerender Re-render
   * @returns {EditorEntity} Result
   */
  async export({
    id,
    rerender = false,
    customOutputArgs = [
      '-c:v',
      'libx264', // Video Codec: libx264, an H.264 encoder
      '-preset',
      'slow', // Slow x264 encoding preset. Default preset is medium. Use the slowest preset that you have patience for.
      '-crf',
      '20', // CRF value of 20 which will result in a high quality output. Default value is 23. A lower value is a higher quality. Use the highest value that gives an acceptable quality.
      '-c:a',
      'aac', // Audio Codec: AAC
      '-b:a',
      '160k', // Encodes the audio with a bitrate of 160k.
      '-vf',
      'format=yuv420p', // Chooses YUV 4:2:0 chroma-subsampling which is recommended for H.264 compatibility
      '-movflags',
      '+faststart', // Is an option for MP4 output that move some data to the beginning of the file after encoding is finished. This allows the video to begin playing faster if it is watched via progressive download playback.
    ],
  }: {
    id: string;
    rerender?: boolean;
    customOutputArgs?: string[];
  }): Promise<EditorEntity> {
    const _editor = await this.editorRepository.findOne({
      relations: {
        videoLayers: {
          file: {
            folder: true,
          },
        },
        audioLayers: {
          file: {
            folder: true,
          },
        },
        renderedFile: {
          folder: true,
        },
        playlist: true,
        user: true,
      },
      where: {
        id,
      },
    });
    if (!_editor) {
      throw new NotFoundError<I18nPath>('error.editor.not_found', {
        args: { id },
      });
    }
    const { id: editorId, renderedFileId, userId } = _editor;
    if (renderedFileId) {
      await this.fileService
        .delete([renderedFileId])
        .then(() =>
          this.editorRepository.update(editorId, {
            renderedFile: null,
          }),
        )
        .then(() => {
          // @ts-expect-error Delete operator must be optional ?
          delete _editor.renderedFile;
        })
        .catch((reason) => {
          this.logger.error(`Delete from editor failed: ${reason}`);
          throw reason;
        });
    }

    if (!rerender) {
      if (
        _editor.renderingStatus === RenderingStatus.Ready ||
        _editor.renderingStatus === RenderingStatus.Pending
      ) {
        // @ts-expect-error Delete operator must be optional ?
        delete _editor.audioLayers;
        // @ts-expect-error Delete operator must be optional ?
        delete _editor.videoLayers;
        return _editor;
      }
    }

    const { videoLayers: video, audioLayers: audio } = _editor;
    const videoLayers = await Promise.all(
      video.map(async (layer) => ({
        ...layer,
        file: await this.fileService.signedUrl(layer.file),
      })),
    );
    const audioLayers = await Promise.all(
      audio.map(async (layer) => ({
        ...layer,
        file: await this.fileService.signedUrl(layer.file),
      })),
    );
    const editor = {
      ..._editor,
      videoLayers,
      audioLayers,
    } as EditorEntity;

    const { id: folderId } = await this.folderService.exportFolder(userId);
    this.editorMsvc.emit<Buffer, MsvcEditorExport>(MsvcEditor.Export, {
      folderId,
      editor,
      customOutputArgs,
    });

    // @ts-expect-error Delete operator must be optional ?
    delete _editor.audioLayers;
    // @ts-expect-error Delete operator must be optional ?
    delete _editor.videoLayers;
    return _editor;
  }

  private async correctLayers(editorId: string): Promise<void> {
    const editor = await this.editorRepository.findOne({
      where: { id: editorId },
      relations: { videoLayers: true, audioLayers: true },
    });
    if (!editor) {
      throw new NotFoundError(`The editor '${editorId}' is not found`);
    }

    let start = 0;
    let index = 1;
    let layers = editor.videoLayers.sort((v1, v2) => v1.index - v2.index);
    const correctedVideoLayers = layers.map((value) => {
      const duration = this.calcDuration(value);
      const layer = {
        duration,
        start,
        index,
      };
      start += duration;
      index += 1;
      return this.editorLayerRepository.update(value.id, layer);
    });

    const editorPromise = this.editorRepository.update(editor.id, {
      renderingStatus: RenderingStatus.Initial,
      renderingPercent: null,
      renderingError: null,
      totalDuration: start,
    });

    start = 0;
    index = 1;
    layers = editor.audioLayers.sort((v1, v2) => v1.index - v2.index);
    const correctedAudioLayers = layers.map((value) => {
      const duration = this.calcDuration(value);
      const layer = {
        duration,
        start,
        index,
      };
      start += duration;
      index += 1;
      return this.editorLayerRepository.update(value.id, layer);
    });

    await Promise.all([
      correctedVideoLayers,
      correctedAudioLayers,
      editorPromise,
    ]);
  }

  /**
   * Move layer index
   *
   * @async
   * @param {string} userId User ID
   * @param {string} editorId Editor ID
   * @param {string} layerId Editor layer id
   * @param {number} moveIndex Move index
   * @memberof EditorService
   */
  async moveIndex(
    editorId: string,
    layerId: string,
    moveIndex: number,
  ): Promise<void> {
    const editor = await this.editorRepository.findOne({
      where: {
        id: editorId,
      },
      relations: { videoLayers: true, audioLayers: true },
    });
    if (!editor) {
      throw new NotFoundError<I18nPath>('error.editor.not_found');
    }
    if (moveIndex < 1) {
      throw new BadRequestError('moveIndex must be greater or equal than 1');
    }

    let layers = editor.videoLayers;
    if (!layers.find((l) => l.id === layerId)) {
      layers = editor.audioLayers;
      if (!layers.find((l) => l.id === layerId)) {
        return;
      }
    }

    let moveIndexLocal = 1;
    const layersBefore = layers
      .map((value) => {
        const duration = this.calcDuration(value);
        if (value.id === layerId) {
          return {
            id: value.id,
            index: moveIndex,
            duration,
          };
        }

        if (moveIndexLocal === moveIndex) {
          moveIndexLocal = moveIndex + 1;
        }
        const result = {
          id: value.id,
          index: moveIndexLocal,
          duration,
        };
        moveIndexLocal += 1;
        return result;
      }, [])
      .sort((a, b) => a.index - b.index);

    let start = 0;
    const layerPromises = layersBefore.map((value) => {
      const result: Partial<EditorLayerEntity> = {
        duration: value.duration,
        index: value.index,
        start,
      };
      start += value.duration;
      return this.editorLayerRepository.update(value.id, result);
    });

    const editorPromise = this.editorRepository.update(editor.id, {
      totalDuration: this.calcTotalDuration(editor.videoLayers),
    });

    await Promise.all([layerPromises, editorPromise]);
  }
}
