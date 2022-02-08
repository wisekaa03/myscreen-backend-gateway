import {
  createReadStream,
  createWriteStream,
  promises as fs,
  ReadStream,
} from 'node:fs';
import path from 'node:path';
import child from 'node:child_process';
import util from 'node:util';
import {
  Injectable,
  Logger,
  BadRequestException,
  NotAcceptableException,
  NotFoundException,
  HttpException,
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
import editly from 'editly';

import { FileCategory, RenderingStatus, VideoType } from '@/enums';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';
import { FileService } from './file.service';
import { FolderService } from './folder.service';

const exec = util.promisify(child.exec);

@Injectable()
export class EditorService {
  private logger = new Logger(EditorService.name);

  private tempDirectory: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly folderService: FolderService,
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
  ): Promise<Array<EditorEntity>> {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['videoLayers', 'audioLayers', 'renderedFile'];
    }
    return this.editorRepository.find(conditional);
  }

  async findAndCount(
    find: FindManyOptions<EditorEntity>,
  ): Promise<[Array<EditorEntity>, number]> {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['videoLayers', 'audioLayers', 'renderedFile'];
    }
    return this.editorRepository.findAndCount(conditional);
  }

  async findOne(
    find: FindManyOptions<EditorEntity>,
  ): Promise<EditorEntity | undefined> {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['videoLayers', 'audioLayers', 'renderedFile'];
    }
    return this.editorRepository.findOne(conditional);
  }

  async update(
    userId: string,
    update: Partial<EditorEntity>,
  ): Promise<EditorEntity | undefined> {
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
  ): Promise<EditorLayerEntity | undefined> {
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
  ): Promise<EditorLayerEntity | undefined> {
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
      const editor = await this.editorRepository.findOneOrFail(editorId);
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

    return this.editorLayerRepository.findOne(layer.id, {
      relations: ['file'],
    });
  }

  /**
   * Update layer
   * @async
   * @param {UserEntity} user User entity
   * @param {number} editorId Editor ID
   * @param {number} layerId Editor Layer ID
   * @param {EditorLayerEntity} update Editor layer entity
   * @returns {EditorLayerEntity | undefined} Result
   */
  async updateLayer(
    userId: string,
    editorId: string,
    layerId: string,
    update: Partial<EditorLayerEntity>,
  ): Promise<EditorLayerEntity | undefined> {
    await this.editorLayerRepository.update(layerId, update);

    if (update.index) {
      await this.moveIndex(userId, editorId, layerId, update.index);
    }

    return this.editorLayerRepository.findOne(layerId, {
      relations: ['file'],
    });
  }

  /**
   * Delete layer
   * @async
   * @param {string} userId User ID
   * @param {EditorEntity} editorID Editor ID
   * @param {EditorLayerEntity} editorLayer Editor layer entity
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
    return layer.duration || 0;
  };

  calcTotalDuration = (video: Partial<EditorLayerEntity>[]): number =>
    video.reduce((duration, layer) => duration + this.calcDuration(layer), 0);

  async prepareFile(
    mkdirPath: string,
    layer: EditorLayerEntity,
  ): Promise<EditorLayerEntity> {
    const { file } = layer;
    const fileName = `${file.id}-${file.name}`;
    const filePath = path.resolve(mkdirPath, fileName);
    // eslint-disable-next-line no-param-reassign
    layer.path = filePath;

    if (!(await fs.access(filePath).catch(() => true))) {
      return layer;
    }

    if (await this.fileService.headS3Object(file)) {
      await new Promise<void>((resolve, reject) => {
        this.fileService
          .getS3Object(file)
          .createReadStream()
          .pipe(createWriteStream(filePath))
          .on('finish', () => resolve())
          .on('error', (error) => {
            this.logger.error(error, error.stack);
            reject(error);
          });
      }).catch((error) => {
        throw new NotFoundException(error);
      });
    } else {
      throw new NotFoundException(`S3 error '${file.name}': Not found`);
    }

    return layer;
  }

  async prepareAssets(
    editor: EditorEntity,
    audio: boolean,
  ): Promise<[string, editly.Config]> {
    const mkdirPath = path.resolve(this.tempDirectory, editor.id);
    await fs.mkdir(mkdirPath, { recursive: true });

    const videoLayersPromise = editor.videoLayers.map(
      async (layer: EditorLayerEntity) => this.prepareFile(mkdirPath, layer),
    );
    const layers = await Promise.all(videoLayersPromise);

    if (audio) {
      const audioLayersPromise = editor.audioLayers.map(
        async (layer: EditorLayerEntity) => this.prepareFile(mkdirPath, layer),
      );
      await Promise.all(audioLayersPromise);
    }

    const { keepSourceAudio, videoLayers, audioLayers, width, height, fps } =
      editor;

    return [
      mkdirPath,
      {
        width,
        height,
        fps,
        keepSourceAudio,
        loopAudio: true,
        clips: [
          {
            duration: this.calcTotalDuration(videoLayers),
            layers: layers.map(
              ({
                id,
                video: _,
                audio: __,
                duration: ___,
                createdAt: _____,
                updatedAt: ______,
                ...layer
              }) => {
                const { file, ...clip } = layer;
                if (file.videoType === VideoType.Image) {
                  return {
                    type: 'image',
                    resizeMode: 'contain',
                    zoomDirection: null,
                    duration: this.calcDuration(layer),
                    ...clip,
                  };
                }
                return {
                  type: 'video',
                  duration: this.calcDuration(layer),
                  ...clip,
                };
              },
            ),
          },
        ],
        audioTracks: audioLayers.map(
          ({
            id,
            video: _,
            audio: __,
            duration: ___,
            file: ____,
            createdAt: _____,
            updatedAt: ______,
            ...layer
          }) => ({ type: 'audio', ...layer }),
        ),
        outPath: mkdirPath,
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
      (clip.layers as editly.Layer[]).every((layer) =>
        (layer as editly.VideoLayer).path.endsWith(format),
      );

    if (isFormat('jpg')) {
      if (clip.layers.length !== 1) {
        throw new NotAcceptableException(
          'Multi-layer editing does not support for images',
        );
      }
      outPath = (clip.layers[0] as editly.VideoLayer).path;
    } else if (isFormat('mp4')) {
      const inputs = (clip.layers as editly.VideoLayer[]).reduce(
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
   * @param {string} userId The user ID
   * @param {string} id Editor ID
   * @returns {EditorEntity} Result
   */
  async export(
    userId: string,
    id: string,
    rerender = false,
  ): Promise<EditorEntity> {
    let editor = await this.editorRepository.findOne(id, {
      relations: ['videoLayers'],
    });
    if (!editor) {
      throw new NotFoundException('Editor not found');
    }
    if (
      (!rerender && editor.renderingStatus === RenderingStatus.Pending) ||
      editor.renderingStatus === RenderingStatus.Error
    ) {
      return editor;
    }

    await this.editorRepository.update(editor.id, {
      totalDuration: this.calcTotalDuration(editor.videoLayers),
      renderingStatus: RenderingStatus.Pending,
      renderingError: null,
      renderingPercent: 0,
    });

    try {
      if (editor.renderedFile) {
        await this.editorRepository.update(editor.id, {
          renderedFile: null,
        });
        await this.fileService.delete(editor.renderedFile);
      }
      editor = await this.editorRepository.findOne(editor.id, {
        relations: ['videoLayers', 'audioLayers', 'renderedFile'],
      });
      if (!editor) {
        throw new NotFoundException('Editor not found');
      }

      const [mkdirPath, editlyConfig] = await this.prepareAssets(editor, true);
      editlyConfig.outPath = path.resolve(mkdirPath, `${editor.name}-out.mp4`);
      // editlyConfig.verbose = true;
      editlyConfig.customOutputArgs = [
        // '-fflags',
        // 'nobuffer',
        // '-flags',
        // 'low_delay',
      ];
      const editlyJSON = JSON.stringify(editlyConfig);
      const editlyPath = path.resolve(mkdirPath, 'editly.json');
      await fs.writeFile(editlyPath, editlyJSON);

      (async (renderEditor: EditorEntity) => {
        const outPath = await new Promise<string>((resolve, reject) => {
          const childEditly = child.fork(
            'node_modules/.bin/editly',
            ['--json', editlyPath],
            {
              silent: true,
            },
          );
          childEditly.stdout?.on('data', async (message: Buffer) => {
            const msg = message.toString();
            this.logger.debug(
              `Editly on '${renderEditor.id} / ${renderEditor.name}': ${msg}`,
              'Editly',
            );
            // DEBUG: Ахмет: Было бы круто увидеть эти проценты здесь https://t.me/c/1337424109/5988
            const percent = msg.match(/(\d+%)/g);
            if (Array.isArray(percent) && percent.length > 0) {
              await this.editorRepository.update(renderEditor.id, {
                renderingPercent: parseInt(percent[percent.length - 1], 10),
              });
            }
          });
          childEditly.stderr?.on('data', (message: Buffer) => {
            const msg = message.toString();
            this.logger.error(msg, undefined, 'Editly');
          });
          childEditly.on('error', (error: Error) => {
            this.logger.error(error.message, error.stack, 'Editly');
            reject(error);
          });
          childEditly.on(
            'exit',
            async (/* code: number | null, signal: NodeJS.Signals | null */) => {
              if (!(await fs.access(editlyConfig.outPath).catch(() => true))) {
                resolve(editlyConfig.outPath);
              }
              reject(
                new Error("outFile not found. There's a some error in editly"),
              );
            },
          );
        }).catch(async (error) => {
          this.logger.error(error);
          await this.editorRepository.update(renderEditor.id, {
            renderingError: error.message,
            renderingStatus: RenderingStatus.Error,
            renderingPercent: null,
          });
        });

        if (!outPath) {
          return;
        }

        const { size } = await fs.stat(outPath);

        const parentFolder = await this.folderService.rootFolder(userId);
        let folder = await this.folderService.findOne({
          where: {
            name: '<Исполненные>',
            parentFolderId: parentFolder.id,
            userId,
          },
        });
        if (!folder) {
          folder = await this.folderService.update({
            name: '<Исполненные>',
            parentFolderId: parentFolder.id,
            userId,
          });
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
        const files: Array<Express.Multer.File> = [
          {
            originalname: outPath.substring(outPath.lastIndexOf('/') + 1),
            encoding: 'utf8',
            mimetype: 'video/mp4',
            destination: outPath.substring(0, outPath.lastIndexOf('/')),
            filename: outPath.substring(outPath.lastIndexOf('/') + 1),
            size,
            path: outPath,
            hash: 'render',
            media,
            fieldname: null as unknown as string,
            stream: null as unknown as ReadStream,
            buffer: null as unknown as Buffer,
          },
        ];
        const filesSaved = await this.fileService.upload(
          userId,
          { folderId: folder.id, category: FileCategory.Media },
          files,
        );

        await this.editorRepository.update(renderEditor.id, {
          renderingStatus: RenderingStatus.Ready,
          renderedFile: filesSaved[0],
          renderingPercent: 100,
          renderingError: null,
        });

        this.logger.log(`Export writed to database: ${JSON.stringify(files)}`);
      })(editor).catch(async (error) => {
        this.logger.error(error);
        if (editor) {
          await this.editorRepository.update(editor.id, {
            renderingError: error.message,
            renderingStatus: RenderingStatus.Error,
            renderingPercent: null,
          });
        }
      });

      const { videoLayers, audioLayers, ...other } = editor;
      return other as EditorEntity;
    } catch (error: unknown) {
      if (editor) {
        await this.editorRepository.update(editor.id, {
          renderingStatus: RenderingStatus.Error,
          renderingError: (error as any).toString(),
          renderingPercent: 0,
        });
      }

      if (error instanceof HttpException) {
        throw error;
      }
      throw new Error(error as any);
    }
  }

  async correctLayers(userId: string, editorId: string): Promise<void> {
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
      editorPromise,
      correctedVideoLayers,
      correctedAudioLayers,
    ]);
  }

  /**
   * Move layer index
   *
   * @async
   * @param {EditorEntity} editor Editor entity
   * @param {string} layerId Editor layer id
   * @param {number} moveIndex Move index
   * @return {*} {EditorLayerEntity}
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
    if (
      !(
        editor.videoLayers.length >= moveIndex ||
        editor.audioLayers.length >= moveIndex
      )
    ) {
      throw new BadRequestException(
        'moveIndex must be less than editor layers',
      );
    }

    let layers = editor.videoLayers.sort((v1, v2) => v1.index - v2.index);
    let layer = layers.find((l) => l.id === layerId);
    if (!layer) {
      layers = editor.audioLayers.sort((v1, v2) => v1.index - v2.index);
      layer = layers.find((l) => l.id === layerId);
    }
    if (!layer) {
      throw new NotFoundException('layerId is not in editor layers');
    }

    let moveIndexLocal = 1;
    const resultLayer = layers.map((value) => {
      if (value.id === layerId) {
        const duration = this.calcDuration(value);
        const result = {
          index: moveIndex,
          duration,
        };
        return this.editorLayerRepository.update(value.id, result);
      }

      const duration = this.calcDuration(value);
      if (moveIndexLocal === moveIndex) {
        moveIndexLocal = moveIndex + 1;
      }
      const result = {
        index: moveIndexLocal,
        duration,
      };
      moveIndexLocal += 1;
      return this.editorLayerRepository.update(value.id, result);
    }, [] as Promise<EditorLayerEntity>[]);

    const editorPromise = this.editorRepository.update(editor.id, {
      renderingStatus: RenderingStatus.Initial,
      renderingPercent: null,
      renderingError: null,
      totalDuration: this.calcTotalDuration(editor.videoLayers),
    });

    await Promise.all([editorPromise, resultLayer]);
  }
}
