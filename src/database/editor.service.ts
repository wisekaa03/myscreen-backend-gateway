import {
  createReadStream,
  createWriteStream,
  promises as fs,
  ReadStream,
} from 'node:fs';
import internal from 'stream';
import StreamPromises from 'node:stream/promises';
import path from 'node:path';
import child from 'node:child_process';
import util from 'node:util';
import {
  Injectable,
  Logger,
  BadRequestException,
  NotAcceptableException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
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

import { FileCategory, RenderingStatus, VideoType } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';
import { FileService } from './file.service';
import { FolderService } from './folder.service';
import { UserEntity } from './user.entity';

const exec = util.promisify(child.exec);

@Injectable()
export class EditorService {
  private logger = new Logger(EditorService.name);

  private tempDirectory: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly folderService: FolderService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
    @InjectRepository(EditorLayerEntity)
    private readonly editorLayerRepository: Repository<EditorLayerEntity>,
  ) {
    this.tempDirectory = this.configService.get<string>(
      'FILES_UPLOAD',
      'upload',
    );
  }

  async find(
    find: FindManyOptions<EditorEntity>,
    caseInsensitive = true,
  ): Promise<Array<EditorEntity>> {
    const conditional = TypeOrmFind.Nullable(find);
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
  ): Promise<[Array<EditorEntity>, number]> {
    const conditional = TypeOrmFind.Nullable(find);
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
      ? this.editorRepository.findOne(TypeOrmFind.Nullable(find))
      : this.editorRepository.findOne({
          relations: ['videoLayers', 'audioLayers', 'renderedFile'],
          ...TypeOrmFind.Nullable(find),
        });
  }

  async update(
    userId: string,
    update: Partial<EditorEntity>,
  ): Promise<EditorEntity | null> {
    const updated: DeepPartial<EditorEntity> = {
      videoLayers: [],
      audioLayers: [],
      renderedFile: null,
      ...update,
      userId,
    };

    const editor = await this.editorRepository.save(
      this.editorRepository.create(updated),
    );
    return this.editorRepository.findOne({ where: { id: editor.id } });
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
  ): Promise<EditorLayerEntity | null> {
    if (update.file === undefined) {
      throw new BadRequestException('file must exists');
    }
    if (update.duration === undefined && update.file) {
      // eslint-disable-next-line no-param-reassign
      update.duration = parseFloat(
        `${update.file.duration || update.file.meta.duration}`,
      );
    }
    if (update.index === undefined) {
      const editor = await this.editorRepository.findOneOrFail({
        where: { id: editorId },
      });
      // eslint-disable-next-line no-param-reassign
      update.index = editor.videoLayers.length;
    }
    if (update.cutFrom === undefined) {
      // eslint-disable-next-line no-param-reassign
      update.cutFrom = 0;
    }
    if (update.cutTo === undefined) {
      // eslint-disable-next-line no-param-reassign
      update.cutTo = update.duration || 0;
    }
    if (update.cutFrom > update.cutTo) {
      throw new BadRequestException('cutFrom must be less than cutTo');
    }
    if (update.duration !== update.cutTo - update.cutFrom) {
      throw new BadRequestException('Duration must be cutTo - cutFrom');
    }

    const layer = await this.editorLayerRepository.save(
      this.editorLayerRepository.create(update),
    );

    await this.moveIndex(userId, editorId, layer.id, update.index);

    return this.editorLayerRepository.findOne({
      relations: ['file'],
      where: {
        id: layer.id,
      },
    });
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
      await this.moveIndex(userId, editorId, layer.id, update.index);
    } else if (update.duration !== undefined) {
      await this.moveIndex(userId, editorId, layer.id, layer.index);
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
    userId: string,
    editorId: string,
    editorLayerId: string,
  ): Promise<DeleteResult> {
    const result = await this.editorLayerRepository.delete(editorLayerId);

    await this.correctLayers(userId, editorId);

    return result;
  }

  calcDuration = (layer: Partial<EditorLayerEntity>): number => {
    if (layer.cutTo !== undefined && layer.cutFrom !== undefined) {
      return layer.cutTo - layer.cutFrom;
    }
    return (
      layer.duration || layer.file?.duration || layer.file?.meta.duration || 0
    );
  };

  calcTotalDuration = (video: Partial<EditorLayerEntity>[]): number =>
    video.reduce((duration, layer) => duration + this.calcDuration(layer), 0);

  private async prepareFile(
    mkdirPath: string,
    layer: EditorLayerEntity,
  ): Promise<EditorLayerEntity> {
    const { file } = layer;
    const filePath = path.join(mkdirPath, file.name);
    // eslint-disable-next-line no-param-reassign
    layer.path = filePath;

    if (!(await fs.access(filePath).catch(() => true))) {
      return layer;
    }

    if (await this.fileService.headS3Object(file)) {
      const outputStream = createWriteStream(filePath);
      const data = await this.fileService.getS3Object(file);
      if (data.Body instanceof internal.Readable) {
        await StreamPromises.pipeline(data.Body, outputStream);
      }
    }

    return layer;
  }

  private async prepareAssets(
    editor: EditorEntity,
    audio: boolean,
  ): Promise<[string, Editly.Config]> {
    await fs.mkdir(this.tempDirectory, { recursive: true });

    const videoLayersPromise = editor.videoLayers.map(
      async (layer: EditorLayerEntity) =>
        this.prepareFile(this.tempDirectory, layer),
    );
    const layers = await Promise.all(videoLayersPromise);

    if (audio) {
      const audioLayersPromise = editor.audioLayers.map(
        async (layer: EditorLayerEntity) =>
          this.prepareFile(this.tempDirectory, layer),
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
      this.tempDirectory,
      {
        width,
        height,
        fps,
        keepSourceAudio,
        clips,
        loopAudio: true,
        audioTracks,
        outPath: path.join(this.tempDirectory, editor.id),
      },
    ];
  }

  // TODO: what a fuck?
  convertSecToTime = (second: number): string => {
    let hours: number | string = Math.floor(second / 3600);
    let minutes: number | string = Math.floor((second - hours * 3600) / 60);
    let seconds: number | string = second - hours * 3600 - minutes * 60;

    if (hours < 10) {
      hours = `0${hours}`;
    }
    if (minutes < 10) {
      minutes = `0${minutes}`;
    }
    if (seconds < 10) {
      seconds = `0${seconds}`;
    }
    return `${hours}:${minutes}:${seconds}`;
  };

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
      throw new NotAcceptableException('No clip found at requested time');
    }

    if (!(typeof clip.layers === 'object' && Array.isArray(clip.layers))) {
      throw new NotAcceptableException('Layers not exists');
    }

    const seekTime = time - startTime;
    const seekTimestamp = this.convertSecToTime(seekTime);

    const isFormat = (format: string) =>
      (clip.layers as Editly.Layer[]).every((layer) =>
        (layer as Editly.VideoLayer).path.endsWith(format),
      );

    if (isFormat('jpg')) {
      if (clip.layers.length !== 1) {
        throw new NotAcceptableException(
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
      throw new NotAcceptableException('Unsupported format to be captured');
    }

    return createReadStream(outPath).on('end', () => {
      fs.unlink(outPath);
    });
  }

  /**
   * Start Export
   * @async
   * @param {UserEntity} user The user
   * @param {string} id Editor ID
   * @param {boolean} rerender Re-render
   * @returns {EditorEntity} Result
   */
  async export(
    user: UserEntity,
    id: string,
    rerender = false,
  ): Promise<EditorEntity | undefined> {
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
      throw new NotFoundException('Editor not found');
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
        await this.editorRepository.update(editor.id, {
          renderedFile: null,
        });
        await this.fileService
          .delete(user, [editor.renderedFile.id])
          .catch((reason) => {
            this.logger.error(`Delete from editor failed: ${reason}`);
            throw reason;
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
      editlyConfig.customOutputArgs = [
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
      ];

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
            // DEBUG: Ахмет: Было бы круто увидеть эти проценты здесь https://t.me/c/1337424109/5988
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
        const folder = await this.folderService
          .rootFolder(user.id)
          .then(async (rootFolder) => {
            const renderedFolder = await this.folderService.findOne({
              where: {
                name: '<Исполненные>',
                parentFolderId: rootFolder.id,
                userId: user.id,
              },
            });
            return (
              renderedFolder ||
              this.folderService.update({
                name: '<Исполненные>',
                parentFolderId: rootFolder.id,
                userId: user.id,
              })
            );
          });
        if (!folder) {
          throw new Error('The file system has run out of space ?');
        }
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
        await this.fileService
          .upload(user, { folderId: folder.id, category: FileCategory.Media }, [
            files,
          ])
          .then((value) => {
            if (value[0]) {
              this.editorRepository.update(renderEditor.id, {
                renderingStatus: RenderingStatus.Ready,
                renderedFile: value[0],
                renderingPercent: 100,
                renderingError: null,
              });
            } else {
              throw new NotFoundException(
                `Upload file not found: ${JSON.stringify(files)}`,
              );
            }
          })
          .catch((reason) => {
            this.logger.error(`Can't write to out file: ${reason}`);
            throw reason;
          });

        this.logger.log(`Writed out file: ${JSON.stringify(files)}`);

        // // Удаляем все
        // const deleteLayer = editlyConfig.clips.map(async (clip) =>
        //   (clip.layers as any)?.[0]?.path
        //     ? fs.unlink((clip.layers as any)[0].path).catch(() => {
        //         this.logger.error(
        //           `Not deleted: ${(clip.layers as any)?.[0]?.path}`,
        //         );
        //       })
        //     : undefined,
        // );
        // if (editlyConfig.audioTracks) {
        //   deleteLayer.concat(
        //     editlyConfig.audioTracks.map(async (track) =>
        //       fs.unlink(track.path).catch(() => {
        //         this.logger.error(`Not deleted: ${track.path}`);
        //       }),
        //     ),
        //   );
        // }
        // deleteLayer.concat(fs.unlink(outPath));
        // await Promise.allSettled(deleteLayer);
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

  private async correctLayers(userId: string, editorId: string): Promise<void> {
    const editor = await this.editorRepository.findOne({
      where: { id: editorId, userId },
      relations: ['videoLayers', 'audioLayers'],
    });
    if (!editor) {
      throw new NotFoundException(`The editor ${editorId} is not found`);
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
    userId: string,
    editorId: string,
    layerId: string,
    moveIndex: number,
  ): Promise<void> {
    const editor = await this.editorRepository.findOne({
      where: {
        userId,
        id: editorId,
      },
      relations: ['videoLayers', 'audioLayers'],
    });
    if (!editor) {
      throw new NotFoundException('Editor not found');
    }
    if (moveIndex < 1) {
      throw new BadRequestException(
        'moveIndex must be greater or equal than 1',
      );
    }

    let layers = editor.videoLayers;
    if (!layers.find((l) => l.id === layerId)) {
      layers = editor.audioLayers;
      if (!layers.find((l) => l.id === layerId)) {
        throw new NotFoundException('layerId is not in editor layers');
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
      const result = {
        duration: value.duration,
        index: value.index,
        start,
      };
      start += value.duration;
      return this.editorLayerRepository.update(value.id, result);
    });

    const editorPromise = this.editorRepository.update(editor.id, {
      renderingStatus: RenderingStatus.Initial,
      renderingPercent: null,
      renderingError: null,
      totalDuration: this.calcTotalDuration(editor.videoLayers),
    });

    await Promise.all([layerPromises, editorPromise]);
  }
}
