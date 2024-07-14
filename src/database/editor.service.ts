import {
  createReadStream,
  createWriteStream,
  promises as fs,
  ReadStream,
} from 'node:fs';
import internal from 'node:stream';
import StreamPromises from 'node:stream/promises';
import path from 'node:path';
import child from 'node:child_process';
import util from 'node:util';
import dayjsDuration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';
import { ffprobe } from 'media-probe';
import Editly from 'editly';

import { BadRequestError, NotAcceptableError, NotFoundError } from '@/errors';
import {
  FileCategory,
  MonitorMultiple,
  MonitorOrientation,
  RenderingStatus,
  BidStatus,
  VideoType,
} from '@/enums';
import { MonitorGroupWithPlaylist } from '@/interfaces';
import { fileExist } from '@/utils/fs';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';
import { FileService } from '@/database/file.service';
import { FolderService } from './folder.service';
import { UserEntity } from './user.entity';
import { BidEntity } from './bid.entity';
import { PlaylistService } from './playlist.service';
import { MonitorService } from '@/database/monitor.service';
import { CrontabService } from '@/crontab/crontab.service';
import { BidService } from '@/database/bid.service';

dayjs.extend(dayjsDuration);
const exec = util.promisify(child.exec);

@Injectable()
export class EditorService {
  private logger = new Logger(EditorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly crontabService: CrontabService,
    private readonly folderService: FolderService,
    @Inject(forwardRef(() => BidService))
    private readonly bidService: BidService,
    private readonly playlistService: PlaylistService,
    @Inject(forwardRef(() => MonitorService))
    private readonly monitorService: MonitorService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
    @InjectRepository(EditorLayerEntity)
    private readonly editorLayerRepository: Repository<EditorLayerEntity>,
  ) {}

  async find(
    find: FindManyOptions<EditorEntity>,
    caseInsensitive = true,
  ): Promise<EditorEntity[]> {
    const conditional = TypeOrmFind.findParams(EditorEntity, find);
    if (!find.relations) {
      conditional.relations = ['videoLayers', 'audioLayers', 'renderedFile'];
    }
    return caseInsensitive
      ? TypeOrmFind.findCI(this.editorRepository, conditional)
      : this.editorRepository.find(conditional);
  }

  async findAndCount(
    find: FindManyOptions<EditorEntity>,
    caseInsensitive = true,
  ): Promise<[EditorEntity[], number]> {
    const conditional = TypeOrmFind.findParams(EditorEntity, find);
    if (!find.relations) {
      conditional.relations = ['videoLayers', 'audioLayers', 'renderedFile'];
    }
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.editorRepository, conditional)
      : this.editorRepository.findAndCount(conditional);
  }

  async findOne(
    find: FindManyOptions<EditorEntity>,
  ): Promise<EditorEntity | null> {
    return find.relations
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

  async findLayer(
    find: FindManyOptions<EditorLayerEntity>,
  ): Promise<EditorLayerEntity[] | undefined> {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['video', 'audio', 'file'];
    }
    if (!find.order) {
      conditional.order = { index: 'ASC', start: 'ASC' };
    }
    return this.editorLayerRepository.find(conditional);
  }

  async findOneLayer(
    find: FindManyOptions<EditorLayerEntity>,
  ): Promise<EditorLayerEntity | null> {
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

    if (updatedQuery.file === undefined) {
      throw new BadRequestError('FILE_MUST_EXISTS');
    }
    if (updatedQuery.duration === undefined) {
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

  calcDuration = (layer: Partial<EditorLayerEntity>): number => {
    if (layer.cutTo !== undefined && layer.cutFrom !== undefined) {
      return layer.cutTo - layer.cutFrom;
    }
    return layer.duration ?? layer.file?.duration ?? 0;
  };

  calcTotalDuration = (video: Partial<EditorLayerEntity>[]): number =>
    video.reduce((duration, layer) => duration + this.calcDuration(layer), 0);

  private async prepareFile(
    mkdirPath: string,
    layer: EditorLayerEntity,
  ): Promise<EditorLayerEntity> {
    const { file } = layer;
    const filePath = path.join(mkdirPath, file.name);

    layer.path = filePath;

    if (!(await fileExist(filePath))) {
      if (await this.fileService.headS3Object(file)) {
        const outputStream = createWriteStream(filePath);
        const data = await this.fileService.getS3Object(file);
        if (data.Body instanceof internal.Readable) {
          await StreamPromises.pipeline(data.Body, outputStream);
        }
      }
    }

    return layer;
  }

  private async prepareAssets(
    editor: EditorEntity,
    audio: boolean,
  ): Promise<[string, Editly.Config]> {
    const { downloadDir } = this.fileService;
    await fs.mkdir(downloadDir, { recursive: true });

    const videoLayersPromise = editor.videoLayers.map(
      async (layer: EditorLayerEntity) => this.prepareFile(downloadDir, layer),
    );
    const layers = await Promise.all(videoLayersPromise);

    if (audio) {
      const audioLayersPromise = editor.audioLayers.map(
        async (layer: EditorLayerEntity) =>
          this.prepareFile(downloadDir, layer),
      );
      await Promise.all(audioLayersPromise);
    }

    const { keepSourceAudio, audioLayers, width, height, fps } = editor;

    const clips = layers.map((layer) => {
      const duration = this.calcDuration(layer);
      if (layer.file.videoType === VideoType.Image) {
        return {
          duration,
          layers: [
            {
              type: 'image',
              resizeMode: 'contain',
              zoomDirection: null,
              path: layer.path,
            } as Editly.ImageLayer,
          ],
          transition: {
            duration: 0,
          },
        };
      }

      return {
        duration,
        layers: [
          {
            type: 'video',
            path: layer.path,
            cutFrom: layer.cutFrom,
            cutTo: layer.cutTo,
            mixVolume: layer.mixVolume,
          } as Editly.VideoLayer,
        ],
        transition: {
          duration: 0,
        },
      };
    });

    const audioTracks = audioLayers.map((layer) => ({
      type: 'audio',
      path: layer.path,
      cutFrom: layer.cutFrom,
      cutTo: layer.cutTo,
      mixVolume: layer.mixVolume,
    }));

    return [
      downloadDir,
      {
        width,
        height,
        fps,
        keepSourceAudio,
        clips,
        loopAudio: true,
        audioTracks,
        outPath: path.join(downloadDir, editor.id),
      },
    ];
  }

  convertSecToTime = (seconds: number): string =>
    dayjs.duration({ seconds }).format('HH:mm:ss');

  /**
   * Capture one frame from Clips
   * @async
   * @param {EditorEntity} editor Editor entity
   * @param {number} time Time in seconds
   * @returns {ReadStream} The read stream
   */
  async captureFrame(editor: EditorEntity, time: number): Promise<ReadStream> {
    const [mkdirPath, editlyConfig] = await this.prepareAssets(editor, false);
    let outPath = path.resolve(mkdirPath, `frame_${time}.jpg`);
    const { width = 800, height = 800, clips } = editlyConfig;

    let startTime = 0;
    const clip = clips.find(({ duration = 1 }) => {
      if (startTime <= time && startTime + duration >= time) {
        return true;
      }
      startTime += duration;
      return false;
    });

    if (!clip || typeof clip !== 'object') {
      this.logger.error('No clip found at requested time');
      throw new NotAcceptableError('No clip found at requested time');
    }

    if (!(typeof clip.layers === 'object' && Array.isArray(clip.layers))) {
      throw new NotAcceptableError('Layers not exists');
    }

    const seekTime = time - startTime;
    const seekTimestamp = this.convertSecToTime(seekTime);

    const isFormat = (format: string) =>
      (clip.layers as Editly.Layer[]).every((layer) =>
        (layer as Editly.VideoLayer).path.endsWith(format),
      );

    if (isFormat('jpg')) {
      if (clip.layers.length !== 1) {
        throw new NotAcceptableError(
          'Multi-layer editing does not support for images',
        );
      }
      outPath = (clip.layers[0] as Editly.VideoLayer).path;
    } else if (isFormat('mp4')) {
      const inputs = (clip.layers as Editly.VideoLayer[]).reduce(
        (input, { path: videoPath }) => `${input}-i ${videoPath} `,
        '',
      );

      await exec(
        `ffmpeg -ss ${seekTimestamp} ${inputs} -r 1 -an -t 1 -vsync 1 -s ${width}x${height} ${outPath}`,
      );
    } else {
      throw new NotAcceptableError('Unsupported format to be captured');
    }

    return createReadStream(outPath).on('end', () => {
      fs.unlink(outPath);
    });
  }

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
      const playlistLocal = await this.playlistService.create({
        name: `Scaling monitor "${monitorName}": #${monitorId}`,
        description: `Scaling monitor "${monitorName}": #${monitorId}`,
        userId,
        monitors: [],
        hide: true,
      });
      // добавляем в плэйлист монитор
      await this.monitorService.update(monitorId, {
        playlist: playlistLocal,
      });
      // создаем редакторы
      const editorsPromise = files.map(async (file) => {
        const editor = await this.create({
          name: `Automatic "${playlist.name}": file #${file.id}`,
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
          playlistId: playlistLocal.id,
        });
        // и добавляем в редактор видео-слой с файлом
        await this.createLayer(bid.user.id, editor.id, {
          index: 0,
          cutFrom: 0,
          cutTo: file.duration,

          // TODO: Сделать разбиение по мониторам
          cropX: 0,
          cropY: 0,
          cropW: 10,
          cropH: 10,

          duration: file.duration,
          mixVolume: 1,
          fileId: file.id,
        });

        return editor;
      });
      await Promise.all(editorsPromise);

      return {
        ...groupMonitor,
        playlist: playlistLocal,
      };
    });
    const monitorPlaylists = await Promise.all(monitorPlaylistsPromise);

    setTimeout(async () => {
      // Запустить рендеринг
      const playlistsPromise = monitorPlaylists.map(async (item) => {
        const editors = await this.editorRepository.find({
          where: { playlistId: item.playlist.id },
        });
        const editorsPromise = editors.map(async (editor) => {
          await this.export({
            user: bid.user,
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
   * Start Export
   * @async
   * @param {UserEntity} user The user
   * @param {string} id Editor ID
   * @param {boolean} rerender Re-render
   * @returns {EditorEntity} Result
   */
  async export({
    user,
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
    user: UserEntity;
    id: string;
    rerender?: boolean;
    customOutputArgs?: string[];
  }): Promise<EditorEntity | undefined> {
    const editor = await this.editorRepository.findOne({
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
      },
      where: {
        id,
      },
    });
    if (!editor) {
      throw new NotFoundError('Editor not found');
    }
    if (!rerender) {
      if (
        editor.renderingStatus !== RenderingStatus.Initial &&
        editor.renderingStatus !== RenderingStatus.Error
      ) {
        const { videoLayers, audioLayers, ...other } = editor;
        return other as EditorEntity;
      }
    }

    try {
      await this.editorRepository.update(editor.id, {
        totalDuration: this.calcTotalDuration(editor.videoLayers),
        renderingStatus: RenderingStatus.Pending,
        renderingError: null,
        renderingPercent: 0,
      });

      if (editor.renderedFile) {
        await this.fileService
          .delete([editor.renderedFile.id])
          .catch((reason) => {
            this.logger.error(`Delete from editor failed: ${reason}`);
            throw reason;
          });
        await this.editorRepository.update(editor.id, {
          renderedFile: null,
        });
      }

      const [mkdirPath, editlyConfig] = await this.prepareAssets(editor, true);
      await fs
        .mkdir(editlyConfig.outPath, { recursive: true })
        .catch((reason) => {
          this.logger.error(
            `Mkdir '${editlyConfig.outPath}' failed: ${reason}`,
          );
          throw reason;
        });
      editlyConfig.outPath = path.join(
        mkdirPath,
        `${path.parse(editor.name).name}-out.mp4`,
      );
      editlyConfig.customOutputArgs = customOutputArgs;

      (async (renderEditor: EditorEntity) => {
        const editlyJSON = JSON.stringify(editlyConfig);
        const editlyPath = path.join(mkdirPath, editor.id, 'editly.json');
        await fs.writeFile(editlyPath, editlyJSON).catch((reason) => {
          this.logger.error(`Write to ${editlyPath} failed: ${reason}`);
          throw reason;
        });

        const outPath = await new Promise<string | Error>((resolve, reject) => {
          const childEditly = child.fork(
            'node_modules/.bin/editly',
            ['--json', editlyPath],
            {
              silent: true,
            },
          );
          childEditly.stdout?.on('data', (message: Buffer) => {
            const msg = message.toString();
            this.logger.debug(
              `Editly on '${renderEditor.id}' / '${renderEditor.name}': ${msg}`,
              'Editly',
            );
            // Ахмет: Было бы круто увидеть эти проценты здесь https://t.me/c/1337424109/5988
            const percent = msg.match(/(\d+%)/g);
            if (Array.isArray(percent) && percent.length > 0) {
              this.editorRepository
                .update(renderEditor.id, {
                  renderingPercent: parseInt(percent[percent.length - 1], 10),
                })
                .catch((error: any) => {
                  this.logger.error(error?.message, error?.stack, 'Editly');
                });
            }
          });
          childEditly.stderr?.on('data', (message: Buffer) => {
            const msg = message.toString();
            this.logger.debug(msg, undefined, 'Editly');
          });
          childEditly.on('error', (error: Error) => {
            this.logger.error(error.message, error.stack, 'Editly');
            reject(error);
          });
          childEditly.on(
            'exit',
            (/* code: number | null, signal: NodeJS.Signals | null */) => {
              resolve(editlyConfig.outPath);
            },
          );
        });
        if (outPath instanceof Error) {
          throw outPath;
        }

        const { size } = await fs.stat(outPath);
        const exportFolder = await this.folderService.exportFolder(user);
        const media = await ffprobe(outPath, {
          showFormat: true,
          showStreams: true,
          showFrames: false,
          showPackets: false,
          showPrograms: false,
          countFrames: false,
          countPackets: false,
        });
        const fileOutParse = path.parse(outPath);
        const files: Express.Multer.File = {
          originalname: fileOutParse.base,
          encoding: 'utf8',
          mimetype: 'video/mp4',
          destination: fileOutParse.dir,
          filename: fileOutParse.base,
          size,
          path: outPath,
          hash: 'render',
          media,
          fieldname: null as unknown as string,
          stream: null as unknown as ReadStream,
          buffer: null as unknown as Buffer,
        };
        const renderedFiles = await this.fileService
          .upload(
            user,
            { folderId: exportFolder.id, category: FileCategory.Media },
            [files],
          )
          .then((renderedFile) => {
            if (renderedFile[0]) {
              this.editorRepository.update(renderEditor.id, {
                renderingStatus: RenderingStatus.Ready,
                renderedFile: renderedFile[0],
                renderingPercent: 100,
                renderingError: null,
              });

              return renderedFile;
            }

            throw new NotFoundError(
              `Upload file not found: '${JSON.stringify(files)}'`,
            );
          })
          .catch((reason) => {
            this.logger.error(`Can't write to out file: ${reason}`);
            throw reason;
          });

        this.logger.log(`Writed out file: ${JSON.stringify(files)}`);

        // Для SCALING, но может быть еще для чего-то
        if (editor.playlistId) {
          const playlist = await this.playlistService.findOne({
            where: { id: editor.playlistId },
            relations: { editors: true },
          });
          if (playlist) {
            // обновляем плэйлист
            await this.playlistService.update(playlist.id, {
              files: renderedFiles,
            });
            if (playlist.editors) {
              const editors = playlist.editors.filter(
                (e) => e.renderingStatus === RenderingStatus.Ready,
              );
              if (editors.length === playlist.editors.length) {
                const bid = await this.bidService.find({
                  where: { playlistId: playlist.id },
                });
                const bidIds = new Set<string>(...bid.map((r) => r.id));
                bidIds.forEach((bidId) => {
                  this.bidService.update(bidId, {
                    status: BidStatus.OK,
                  });
                });
              }
            } else {
              this.logger.error(
                `Editors not found: editorId="${editor.id}" / playlistId="${playlist.id}"`,
              );
            }
          } else {
            this.logger.error(
              `Playlist not found: playlistId="${editor.playlistId}"`,
            );
          }
        }
      })(editor).catch((error: any) => {
        this.logger.error(error?.message, error?.stack, 'Editly');
        this.editorRepository.update(editor.id, {
          renderingError: error?.message || error,
          renderingStatus: RenderingStatus.Error,
          renderingPercent: null,
        });
      });

      const { videoLayers, audioLayers, ...other } = editor;
      return other as EditorEntity;
    } catch (error: unknown) {
      let renderingError: string;
      if (error instanceof Error) {
        renderingError = error.message;
      } else {
        renderingError = error as string;
      }
      this.editorRepository.update(editor.id, {
        renderingStatus: RenderingStatus.Error,
        renderingError,
        renderingPercent: 0,
      });

      throw error;
    }
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
      throw new NotFoundError('Editor not found');
    }
    if (moveIndex < 1) {
      throw new BadRequestError('moveIndex must be greater or equal than 1');
    }

    let layers = editor.videoLayers;
    if (!layers.find((l) => l.id === layerId)) {
      layers = editor.audioLayers;
      if (!layers.find((l) => l.id === layerId)) {
        throw new NotFoundError('layerId is not in editor layers');
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
