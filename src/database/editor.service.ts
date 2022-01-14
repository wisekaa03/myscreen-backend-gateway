import {
  createReadStream,
  createWriteStream,
  promises as fs,
  ReadStream,
} from 'node:fs';
import path from 'node:path';
import child, { Serializable } from 'node:child_process';
import util from 'node:util';
import {
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
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

import { FileCategory, RenderingStatus } from '@/enums';
import { UserEntity } from './user.entity';
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

  find = async (
    find: FindManyOptions<EditorEntity>,
  ): Promise<[Array<EditorEntity>, number]> =>
    this.editorRepository.findAndCount({
      ...find,
      relations: ['videoLayers', 'audioLayers', 'renderedFile'],
    });

  findOne = async (
    find: FindManyOptions<EditorEntity>,
  ): Promise<EditorEntity | undefined> => this.editorRepository.findOne(find);

  async update(
    user: UserEntity,
    update: Partial<EditorEntity>,
  ): Promise<EditorEntity> {
    const order: DeepPartial<EditorEntity> = {
      ...update,
      userId: user.id,
    };

    return this.editorRepository.save(this.editorRepository.create(order));
  }

  delete = async (
    user: UserEntity,
    editor: EditorEntity,
  ): Promise<DeleteResult> =>
    this.editorRepository.delete({
      id: editor.id,
      userId: user.id,
    });

  findOneLayer = async (
    find: FindManyOptions<EditorLayerEntity>,
  ): Promise<EditorLayerEntity | undefined> =>
    this.editorLayerRepository.findOne({
      ...find,
      relations: ['videoLayers', 'audioLayers', 'file'],
    });

  /**
   * Update layer
   * @async
   * @param {UserEntity} user User entity
   * @param {number} id Editor entity id
   * @param {EditorLayerEntity} update Editor layer entity
   * @returns {EditorLayerEntity | undefined} Result
   */
  updateLayer = async (
    user: UserEntity,
    id: string,
    update: Partial<EditorLayerEntity>,
  ): Promise<EditorLayerEntity | undefined> =>
    this.editorLayerRepository.save(this.editorLayerRepository.create(update));

  /**
   * Delete layer
   * @async
   * @param {UserEntity} user User entity
   * @param {EditorLayerEntity} update Editor layer entity
   * @returns {DeleteResult} Result
   */
  deleteLayer = async (editorLayer: EditorLayerEntity): Promise<DeleteResult> =>
    this.editorLayerRepository.delete({
      id: editorLayer.id,
    });

  performDurationTrim = (layer: EditorLayerEntity): number => {
    if (layer.cutTo !== undefined && layer.cutFrom !== undefined) {
      return layer.cutTo - layer.cutFrom;
    }
    return layer.duration;
  };

  calculateDuration = (layers: EditorLayerEntity[]): number =>
    layers.reduce(
      (duration, layer) => duration + this.performDurationTrim(layer),
      0,
    );

  prepareFile = async (
    mkdirPath: string,
    layer: EditorLayerEntity,
  ): Promise<EditorLayerEntity> => {
    const { file } = layer;
    const fileName = `${file.id}-${file.originalName}`;
    const filePath = path.resolve(mkdirPath, fileName);
    // eslint-disable-next-line no-param-reassign
    layer.path = filePath;

    if (!(await fs.access(filePath).catch(() => true))) {
      return layer;
    }

    if (await this.fileService.headS3Object(file)) {
      const writeStram = this.fileService
        .getS3Object(file)
        .createReadStream()
        .pipe(createWriteStream(filePath));
      await new Promise<void>((resolve, reject) => {
        writeStram.on('end', resolve).on('error', (error) => {
          this.logger.error(error, error.stack);
          reject(error);
        });
      });
    } else {
      throw new NotFoundException();
    }

    return layer;
  };

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
    const duration = this.calculateDuration(videoLayers);

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
            duration,
            layers: layers.map(
              ({
                id,
                videoLayers: _,
                audioLayers: __,
                duration: ___,
                file: ____,
                createdAt: _____,
                updatedAt: ______,
                ...layer
              }) => ({
                type: 'video',
                ...layer,
              }),
            ),
          },
        ],
        audioTracks: audioLayers.map(
          ({
            id,
            videoLayers: _,
            audioLayers: __,
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
   * @param {UserEntity} user The user entity
   * @param {EditorEntity} editor Editor entity
   * @returns {EditorEntity} Result
   */
  async export(user: UserEntity, editor: EditorEntity): Promise<EditorEntity> {
    const [mkdirPath, editlyConfig] = await this.prepareAssets(editor, true);
    editlyConfig.outPath = path.resolve(mkdirPath, 'out.mp4');
    editlyConfig.verbose = true;
    const editlyJSON = JSON.stringify(editlyConfig);
    const editlyPath = path.resolve(mkdirPath, 'editly.json');

    fs.writeFile(editlyPath, editlyJSON)
      .then(
        () =>
          new Promise<string>((resolve, reject) => {
            const childEditly = child.fork('node_modules/.bin/editly', [
              '--json',
              editlyPath,
            ]);
            childEditly.on('message', (message: Serializable) => {
              this.logger.log(message);
            });
            childEditly.on('error', (error: Error) => {
              this.logger.error(error);
              reject(error);
            });
            childEditly.on(
              'exit',
              async (/* code: number | null, signal: NodeJS.Signals | null */) => {
                if (
                  !(await fs.access(editlyConfig.outPath).catch(() => true))
                ) {
                  resolve(editlyConfig.outPath);
                }
                reject(
                  new Error(
                    "outFile not found. There's a some error in editly",
                  ),
                );
              },
            );
          }),
      )
      .then(async (outPath: string) => {
        const { size } = await fs.stat(outPath);

        let folder = await this.folderService.findOne({
          where: { name: 'Rendered', userId: user.id },
        });
        if (!folder) {
          folder = await this.folderService.update({ name: 'Rendered', user });
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
        const [filesSaved] = await this.fileService.upload(
          user,
          { folderId: folder.id, category: FileCategory.Media },
          files,
        );

        await this.editorRepository.save(
          this.editorRepository.create({
            ...editor,
            renderingStatus: RenderingStatus.Ready,
            renderedFile: filesSaved[0],
          }),
        );
      })
      .catch(async (error: Error) => {
        this.logger.error(error);
        await this.editorRepository.save(
          this.editorRepository.create({
            ...editor,
            renderingError: error.message,
            renderingStatus: RenderingStatus.Error,
          }),
        );
      });

    return this.editorRepository.save(
      this.editorRepository.create({
        ...editor,
        totalDuration: this.calculateDuration(editor.videoLayers),
        renderingStatus: RenderingStatus.Pending,
      }),
    );
  }
}
