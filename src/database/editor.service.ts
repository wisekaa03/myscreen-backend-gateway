import dayjsDuration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, DeleteResult, EntityManager, Repository } from 'typeorm';

import { I18nPath } from '@/i18n';
import {
  BadRequestError,
  InternalServerError,
  NotAcceptableError,
  NotFoundError,
} from '@/errors';
import {
  MonitorMultiple,
  RenderingStatus,
  MsvcEditor,
  MSVC_EXCHANGE,
  MonitorOrientation,
} from '@/enums';
import {
  FindManyOptionsExt,
  FindOneOptionsExt,
  MonitorGroupWithPlaylist,
} from '@/interfaces';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';
import { FileService } from '@/database/file.service';
import { FolderService } from './folder.service';
import { BidEntity } from './bid.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { MonitorGroupEntity } from './monitor.group.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

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
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly amqpConnection: AmqpConnection,
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
    update: Partial<EditorEntity>,
  ): Promise<EditorEntity> {
    const updated = await this.editorRepository.update(id, update);
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
  async createLayer({
    editorId,
    update,
    moveIndex = true,
    transact,
  }: {
    editorId: string;
    update: Partial<EditorLayerEntity>;
    moveIndex?: boolean;
    transact?: EntityManager;
  }): Promise<EditorLayerEntity> {
    const _transact = transact ?? this.entityManager;
    const updatedQuery: DeepPartial<EditorLayerEntity> = { ...update };

    if (updatedQuery.fileId === undefined) {
      throw new BadRequestError<I18nPath>('error.bid.file_must_exists');
    }
    if (updatedQuery.duration === undefined) {
      if (updatedQuery.file === undefined) {
        throw new BadRequestError<I18nPath>('error.bid.file_must_exists');
      }
      updatedQuery.duration = Number(updatedQuery.file.duration);
    }
    if (updatedQuery.index === undefined) {
      const editor = await _transact.findOneOrFail(EditorEntity, {
        where: { id: editorId },
        loadEagerRelations: false,
        relations: { videoLayers: true },
      });
      if (!editor.videoLayers) {
        throw new InternalServerError();
      }
      updatedQuery.index = editor.videoLayers.length;
    }
    if (updatedQuery.cutFrom === undefined) {
      updatedQuery.cutFrom = 0;
    }
    if (updatedQuery.cutTo === undefined) {
      updatedQuery.cutTo = Number(updatedQuery.duration);
    }
    if (updatedQuery.cutFrom > updatedQuery.cutTo) {
      throw new BadRequestError('cutFrom must be less than cutTo');
    }
    if (updatedQuery.duration !== updatedQuery.cutTo - updatedQuery.cutFrom) {
      throw new BadRequestError('Duration must be cutTo - cutFrom');
    }

    const layer = await _transact.save(
      EditorLayerEntity,
      _transact.create(EditorLayerEntity, updatedQuery),
    );

    if (moveIndex) {
      await this.moveIndex({
        editorId,
        layerId: layer.id,
        moveIndex: updatedQuery.index,
        transact,
      });
    }

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
      await this.moveIndex({
        editorId,
        layerId: layer.id,
        moveIndex: update.index,
      });
    } else if (update.duration !== undefined) {
      await this.moveIndex({
        editorId,
        layerId: layer.id,
        moveIndex: layer.index,
      });
    }

    return this.editorLayerRepository.findOne({
      relations: ['file'],
      where: {
        id: layer.id,
      },
    });
  }

  private async correctLayers(editor: EditorEntity): Promise<number> {
    if (!editor.videoLayers || !editor.audioLayers) {
      throw new InternalServerError();
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

    const totalDuration = start;

    start = 0;
    index = 1;
    layers = editor.audioLayers.sort((v1, v2) => v1.index - v2.index);
    const correctedAudioLayers = layers.map(async (value) => {
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

    await Promise.all([correctedVideoLayers, correctedAudioLayers]);

    return totalDuration;
  }

  /**
   * Delete layer
   * @async
   * @param {string} userId User ID
   * @param {EditorEntity} editorId Editor ID
   * @param {EditorLayerEntity} editorLayerId Editor layer entity
   * @returns {DeleteResult} Result
   */
  async deleteLayer({
    userId,
    editorId,
    layerId,
  }: {
    userId: string;
    editorId: string;
    layerId: string;
  }): Promise<EditorEntity> {
    const editor = await this.editorRepository.findOne({
      where: { userId, id: editorId },
      relations: { videoLayers: { file: true }, audioLayers: { file: true } },
    });
    if (!editor || !editor.videoLayers || !editor.audioLayers) {
      throw new NotFoundError<I18nPath>('error.editor.not_found', {
        args: { id: editorId },
      });
    }
    editor.videoLayers = editor.videoLayers.filter(
      (layer) => layer.id !== layerId,
    );
    editor.audioLayers = editor.audioLayers.filter(
      (layer) => layer.id !== layerId,
    );
    editor.totalDuration = await this.correctLayers(editor);

    await this.editorRepository.save(editor);
    await this.editorLayerRepository.delete(layerId);

    return editor;
  }

  private calcDuration = (layer: Partial<EditorLayerEntity>): number => {
    if (layer.cutTo !== undefined && layer.cutFrom !== undefined) {
      return layer.cutTo - layer.cutFrom;
    }
    return layer.duration ?? layer.file?.duration ?? 0;
  };

  private async groupMonitorsPlaylist({
    userId,
    monitor,
    groupMonitors,
    playlist,
    transact,
  }: {
    userId: string;
    monitor: MonitorEntity;
    groupMonitors: MonitorGroupEntity[];
    playlist: PlaylistEntity;
    transact: EntityManager;
  }): Promise<MonitorGroupWithPlaylist[]> {
    const { files } = playlist;

    const maxCol = Math.max(...groupMonitors.map((m) => m.col));
    const maxRow = Math.max(...groupMonitors.map((m) => m.row));

    // Определяем общую ширину и высоту видеостены
    const totalWidth = groupMonitors
      .filter((m) => m.col === maxCol)
      .reduce(
        (acc, m) =>
          acc + m.monitor.orientation === MonitorOrientation.Horizontal
            ? m.monitor.width
            : m.monitor.height,
        0,
      );
    const totalHeight = groupMonitors
      .filter((m) => m.row === maxRow)
      .reduce(
        (acc, m) =>
          acc + m.monitor.orientation === MonitorOrientation.Horizontal
            ? m.monitor.height
            : m.monitor.width,
        0,
      );
    await transact.update(MonitorEntity, monitor.id, {
      width: totalWidth,
      height: totalHeight,
    });

    const groupMonitorsPromise = groupMonitors.map(async (groupMonitor) => {
      const { row, col } = groupMonitor;
      const {
        name: monitorName,
        id: monitorId,
        width: widthMonitor,
        height: heightMonitor,
      } = groupMonitor.monitor;

      // создаем плэйлист
      const playlistInsert = await transact.upsert(
        PlaylistEntity,
        {
          name: `AUTO: monitor=${monitorName}`,
          description: `Scaling monitor "${monitorName}"`,
          userId,
          monitors: [],
          files: [],
          parentPlaylist: playlist,
        },
        { conflictPaths: ['userId', 'name'] },
      );
      const playlistId = playlistInsert.identifiers?.[0].id;
      if (!playlistId) {
        throw new InternalServerError();
      }
      const _playlist = await transact.findOne(PlaylistEntity, {
        where: { id: playlistId },
      });
      if (!_playlist) {
        throw new InternalServerError();
      }

      // добавляем в плэйлист монитор
      await transact.update(MonitorEntity, monitorId, {
        playlistId,
      });

      const groupEditors = [];

      // создаем редакторы
      for (const file of files) {
        const cropW = widthMonitor;
        const cropH = heightMonitor;
        const cropX = (col - 1) * widthMonitor;
        const cropY = (row - 1) * heightMonitor;
        const editorInsert = await transact.upsert(
          EditorEntity,
          {
            name: `AUTO: monitor=${monitorName}, file=${file.name}, playlist=${playlist.name}`,
            userId,
            width: widthMonitor,
            height: heightMonitor,
            fps: 24,
            keepSourceAudio: true,
            totalDuration: 0,
            renderingStatus: RenderingStatus.Initial,
            renderingPercent: null,
            renderingError: null,
            renderedFile: null,
            monitorId,
            playlistId,

            cropW,
            cropH,
            cropX,
            cropY,

            totalWidth,
            totalHeight,
          },
          { conflictPaths: ['userId', 'name'] },
        );
        const editor = editorInsert.identifiers[0] as EditorEntity;
        if (!editor) {
          throw new InternalServerError();
        }
        const editorId = editor.id;

        // ...и добавляем в редактор видео-слой с файлом
        await this.createLayer({
          editorId,
          update: {
            index: 1,
            cutFrom: 0,
            cutTo: file.duration,
            video: [editor],

            duration: file.duration,
            mixVolume: 1,

            fileId: file.id,
          },
          transact,
        });

        groupEditors.push(() =>
          this.editorExport({
            id: editorId,
            rerender: true,
          }),
        );
      }

      return {
        ...groupMonitor,
        playlist: _playlist,
        playlistId: _playlist.id,
        groupEditors,
      };
    });

    return Promise.all(groupMonitorsPromise);
  }

  async partitionMonitors({
    bid,
    transact,
  }: {
    bid: BidEntity;
    transact: EntityManager;
  }): Promise<MonitorGroupWithPlaylist[] | null> {
    if (!bid.monitor || !bid.playlist) {
      throw new InternalServerError();
    }
    const { playlist, userId } = bid;
    const { multiple, groupMonitors } = bid.monitor;
    if (!groupMonitors) {
      return null;
    }

    if (multiple !== MonitorMultiple.SCALING) {
      const monitorMultipleWithPlaylist = groupMonitors.map((item) => ({
        ...item,
        playlist,
        playlistId: playlist.id,
      }));

      return monitorMultipleWithPlaylist;
    }

    return this.groupMonitorsPlaylist({
      userId,
      monitor: bid.monitor,
      playlist,
      groupMonitors,
      transact,
    });
  }

  /**
   * Start Export creation
   * @async
   * @param {UserEntity} user The user
   * @param {string} id Editor ID
   * @param {boolean} rerender Re-render
   * @returns {EditorEntity} Result
   */
  async editorExport({
    id,
    rerender = false,
    customOutputArgs,
  }: {
    id: string;
    rerender?: boolean;
    customOutputArgs?: string[];
  }): Promise<EditorEntity> {
    const _editor = await this.editorRepository.findOne({
      where: {
        id,
      },
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
        monitor: true,
        user: true,
      },
    });
    if (!_editor) {
      throw new NotFoundError<I18nPath>('error.editor.not_found', {
        args: { id },
      });
    }
    if (!_editor.videoLayers || !_editor.audioLayers) {
      throw new InternalServerError();
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
          // @ts-expect-error The operand of delete must be optional
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
        delete _editor.audioLayers;
        delete _editor.videoLayers;
        return _editor;
      }
    }

    const { videoLayers: video, audioLayers: audio } = _editor;
    const videoLayers = await Promise.all(
      video.map(async (layer) => ({
        ...layer,
        file: layer.file && (await this.fileService.signedUrl(layer.file)),
      })),
    );
    const audioLayers = await Promise.all(
      audio.map(async (layer) => ({
        ...layer,
        file: layer.file && (await this.fileService.signedUrl(layer.file)),
      })),
    );
    const editor = {
      ..._editor,
      videoLayers,
      audioLayers,
    } as EditorEntity;

    const { id: folderId } = await this.folderService.exportFolder(userId);

    this.amqpConnection.publish(MSVC_EXCHANGE.EDITOR, MsvcEditor.Export, {
      folderId,
      editor,
      customOutputArgs,
    });

    return editor;
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
  async moveIndex({
    editorId,
    layerId,
    moveIndex,
    transact,
  }: {
    editorId: string;
    layerId: string;
    moveIndex: number;
    transact?: EntityManager;
  }): Promise<void> {
    const _transact = transact ?? this.entityManager;

    const editor = await _transact.findOne(EditorEntity, {
      where: {
        id: editorId,
      },
      relations: { videoLayers: true, audioLayers: true },
    });
    if (!editor) {
      throw new NotFoundError<I18nPath>('error.editor.not_found');
    }
    if (!editor.videoLayers || !editor.audioLayers) {
      throw new InternalServerError();
    }
    if (moveIndex < 1) {
      throw new BadRequestError('moveIndex must be greater or equal than 1');
    }

    let layerIdx = -1;
    const layers = [editor.videoLayers, editor.audioLayers].find((layers) => {
      const idx = layers.findIndex((l) => l.id === layerId);
      if (idx !== -1) {
        layerIdx = idx;
        return true;
      }
      return false;
    });
    const layer = layers?.[layerIdx];

    if (!layer) {
      throw new BadRequestError(`layer is not found with ID "${layerId}"`);
    }

    if (moveIndex === layer.index) {
      return;
    }
    const moveDirection = moveIndex > layer.index ? 'forward' : 'backward';
    let { start, index } = layer;

    const movedLayers = layers
      .map(
        moveDirection === 'forward'
          ? (l: EditorLayerEntity) => {
              if (moveIndex >= l.index && l.index > layer.index) {
                start += l.duration;
                index += 1;

                return {
                  ...l,
                  start: l.start - layer.duration,
                  index: l.index - 1,
                };
              }
            }
          : (l: EditorLayerEntity) => {
              if (layer.index > l.index && l.index >= moveIndex) {
                start -= l.duration;
                index -= 1;

                return {
                  ...l,
                  start: l.start + layer.duration,
                  index: l.index + 1,
                };
              }
            },
      )
      .filter((l): l is NonNullable<typeof l> => Boolean(l));

    await Promise.all(
      movedLayers
        .concat({
          ...layer,
          start,
          index,
        })
        .map((l) =>
          _transact.update(EditorLayerEntity, l.id, {
            start: l.start,
            index: l.index,
          }),
        ),
    );
  }
}
