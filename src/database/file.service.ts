import {
  createReadStream,
  unlink,
  promises as fs,
  createWriteStream,
} from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { PromiseResult } from 'aws-sdk/lib/request';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectS3, S3 } from 'nestjs-s3';
import {
  Repository,
  FindManyOptions,
  DeepPartial,
  Transaction,
  TransactionRepository,
  DeleteResult,
} from 'typeorm';

// import { isAWSError } from '@/shared/is-aws-error';
import { FileCategory, VideoType } from '@/enums';
import { FileUploadRequest } from '@/dto';
import { getS3Name } from '@/shared/get-name';
import { FfMpegPreview } from '@/shared/ffmpeg';
import { EditorService } from '@/database/editor.service';
import { FileEntity, MediaMeta } from './file.entity';
import { FilePreviewEntity } from './file-preview.entity';
import { FolderService } from './folder.service';
import { MonitorService } from './monitor.service';
import { MonitorEntity } from './monitor.entity';
import { FolderEntity } from './folder.entity';
import { PlaylistService } from './playlist.service';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);

  public bucket: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => FolderService))
    private readonly folderService: FolderService,
    private readonly monitorService: MonitorService,
    @Inject(forwardRef(() => EditorService))
    private readonly editorService: EditorService,
    @Inject(forwardRef(() => PlaylistService))
    private readonly playlistService: PlaylistService,
    @InjectS3()
    private readonly s3Service: S3,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(FilePreviewEntity)
    private readonly filePreviewRepository: Repository<FilePreviewEntity>,
  ) {
    this.bucket = configService.get<string>('AWS_BUCKET', 'myscreen-media');
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {[FileEntity[], number]} Результат
   */
  async find(find: FindManyOptions<FileEntity>): Promise<Array<FileEntity>> {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['monitors', 'playlists'];
    }
    return this.fileRepository.find(conditional);
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {[FileEntity[], number]} Результат
   */
  async findAndCount(
    find: FindManyOptions<FileEntity>,
  ): Promise<[Array<FileEntity>, number]> {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['monitors', 'playlists'];
    }
    return this.fileRepository.findAndCount(conditional);
  }

  /**
   * Get file
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {FileEntity} Результат
   */
  async findOne(
    find: FindManyOptions<FileEntity>,
  ): Promise<FileEntity | undefined> {
    const conditional = find;
    if (!find.relations) {
      conditional.relations = ['monitors', 'playlists'];
    }
    return this.fileRepository.findOne(conditional);
  }

  /**
   * Update file
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {FileEntity} Результат
   */
  @Transaction()
  async update(
    file: FileEntity,
    update: Partial<FileEntity>,
    @TransactionRepository(FileEntity)
    fileRepository: Repository<FileEntity> = this.fileRepository,
  ): Promise<FileEntity | undefined> {
    if (update.folderId !== undefined && update.folderId !== file.folder.id) {
      const s3Name = getS3Name(file.name);
      const Key = `${update.folderId}/${file.hash}-${s3Name}`;
      const CopySource = `${file.folder.id}/${file.hash}-${s3Name}`;

      return Promise.all([
        fileRepository.save(fileRepository.create(update)),
        this.s3Service
          .copyObject({
            Bucket: this.bucket,
            Key,
            CopySource: `${this.bucket}/${CopySource}`,
            MetadataDirective: 'REPLACE',
          })
          .promise()
          .then(() =>
            this.s3Service
              .deleteObject({ Bucket: this.bucket, Key: CopySource })
              .promise()
              .catch((error) => {
                this.logger.error('S3 Error deleteObject:', error);
                throw new Error(error);
              }),
          )
          .catch((error) => {
            this.logger.error('S3 Error copyObject:', error);
            throw new Error(error);
          }),
      ]).then(([updated]) => updated);
    }

    return fileRepository.save(
      fileRepository.create({ id: file.id, ...update }),
    );
  }

  async updatePreview(
    update: Partial<FilePreviewEntity>,
  ): Promise<FilePreviewEntity> {
    return this.filePreviewRepository.save(
      this.filePreviewRepository.create(update),
    );
  }

  /**
   * Upload files
   * @async
   * @param {string} userId
   * @param {string} folderId
   * @param {Array<Express.Multer.File>} files
   */
  @Transaction()
  async upload(
    userId: string,
    {
      folderId: folderIdp = undefined,
      category = FileCategory.Media,
      monitorId = undefined,
    }: FileUploadRequest,
    files: Array<Express.Multer.File>,
    @TransactionRepository(FileEntity)
    fileRepository?: Repository<FileEntity>,
  ): Promise<Array<FileEntity>> {
    if (!fileRepository) {
      throw new ServiceUnavailableException('TypeOrm transaction');
    }

    let folder: FolderEntity | undefined;
    if (!folderIdp) {
      folder = await this.folderService.rootFolder(userId);
    } else {
      folder = await this.folderService.findOne({
        where: { userId, id: folderIdp },
      });
    }
    if (!folder) {
      throw new NotFoundException(`Folder '${folderIdp}' not found`);
    }
    const folderId = folder.id;

    let monitor: MonitorEntity | undefined;
    if (!monitorId && category !== FileCategory.Media) {
      throw new NotFoundException('monitorId is expected');
    }
    if (monitorId && category === FileCategory.Media) {
      throw new NotFoundException("Found category: 'media' and monitorId");
    }
    if (monitorId) {
      monitor = await this.monitorService.findOne({
        where: { userId, id: monitorId },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }
    }
    if (!monitor && category !== FileCategory.Media) {
      throw new NotFoundException('monitorId is expected');
    }
    if (monitor && category === FileCategory.Media) {
      throw new NotFoundException("Found category: 'media' and monitorId");
    }
    if (category === FileCategory.Media) {
      files.forEach((file) => {
        if (!file.media) {
          throw new BadRequestException(
            `'${file.originalname}' has no data in Ffprobe, but the category specified 'media'`,
          );
        }
      });
    }

    const filesPromises = files.map(async (file) => {
      const [meta, videoType, extension, preview] = await this.metaInformation(
        file,
        category,
      );

      const media: DeepPartial<FileEntity> = {
        userId,
        folder,
        name: file.originalname,
        filesize: meta.filesize,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        meta,
        videoType,
        category,
        extension,
        hash: file.hash,
        preview: {
          preview: Buffer.from(`\\x${preview.toString('hex')}`),
        },
        monitors: monitorId ? [{ id: monitorId }] : undefined,
      };

      const update = await fileRepository.save(fileRepository.create(media));
      return fileRepository.findOneOrFail(update.id);
    });
    const returnFiles = await Promise.all(filesPromises);

    const s3Promises = files.map(async (file) => {
      const Key = `${folderId}/${file.hash}-${getS3Name(file.originalname)}`;
      try {
        const promise = await this.s3Service
          .upload({
            Bucket: this.bucket,
            Key,
            ContentType: file.mimetype,
            Body: createReadStream(file.path),
          })
          .promise();
        this.logger.debug(
          `The file '${file.path}' has been uploaded on S3 '${promise.Key}'`,
        );
      } catch (error) {
        this.logger.error('S3 Error: upload', error);
        throw new ServiceUnavailableException(error);
      }
    });
    await Promise.all(s3Promises);

    files.forEach((file) =>
      unlink(file.path, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          this.logger.error(`${file.path} was NOT deleted: ${err}`);
        } else {
          this.logger.debug(`${file.path} was deleted`);
        }
      }),
    );

    return returnFiles;
  }

  headS3Object(
    file: FileEntity,
  ): Promise<PromiseResult<AWS.S3.HeadObjectOutput, AWS.AWSError>> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service
      .headObject({
        Bucket: this.bucket,
        Key,
      })
      .promise();
  }

  getS3Object(
    file: FileEntity,
  ): AWS.Request<AWS.S3.GetObjectOutput, AWS.AWSError> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service.getObject({
      Bucket: this.bucket,
      Key,
    });
  }

  deleteS3Object(
    file: FileEntity,
  ): Promise<PromiseResult<AWS.S3.DeleteObjectOutput, AWS.AWSError>> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service
      .deleteObject({
        Bucket: this.bucket,
        Key,
      })
      .promise();
  }

  /**
   * Delete files
   * @async
   * @param {UserEntity} user
   * @param {string} id File ID
   */
  async delete(file: FileEntity): Promise<DeleteResult> {
    const [editorFiles, playlistFiles] = await Promise.all([
      this.editorService.find({
        where:
          `"EditorEntity"."renderedFileId"='${file.id}'` +
          ` OR "EditorEntity__videoLayers"."fileId"='${file.id}'` +
          ` OR "EditorEntity__audioLayers"."fileId"='${file.id}'`,
      }),
      this.playlistService.find({
        where: `"PlaylistEntity__files"."id"='${file.id}'`,
      }),
    ]);
    if (
      (Array.isArray(editorFiles) && editorFiles.length > 0) ||
      (Array.isArray(playlistFiles) && playlistFiles.length > 0)
    ) {
      const errorMsg = {} as {
        editor: { id: string; name: string }[] | null;
        playlist: { id: string; name: string }[] | null;
        monitor: { id: string; name: string }[] | null;
      };
      if (Array.isArray(editorFiles) && editorFiles.length > 0) {
        errorMsg.editor = editorFiles.map((editor) => ({
          id: editor.id,
          name: editor.name,
        }));
      }
      if (Array.isArray(playlistFiles) && playlistFiles.length > 0) {
        errorMsg.playlist = playlistFiles.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
        }));
      }
      throw new ConflictException(
        errorMsg,
        'Файл, который Вы пытаетесь удалить используется в редакторе или в плэйлисте',
      );
    }

    (async () => {
      await this.headS3Object(file)
        .then(() =>
          this.deleteS3Object(file)
            .then((value) => {
              this.logger.debug(
                `The file has been deleted: ${
                  value.$response.data?.DeleteMarker || true
                }`,
              );
            })
            .catch((error) => {
              this.logger.error(
                `S3 Error deleteObject: ${JSON.stringify(error)}`,
              );
            }),
        )
        .catch((error) => {
          this.logger.error(`S3 Error headerObject: ${JSON.stringify(error)}`);
        });
    })();

    return this.fileRepository.delete(file.id);
  }

  async previewFile(file: FileEntity): Promise<Buffer> {
    const downloadDir = path.join(
      this.configService.get<string>('FILES_UPLOAD', 'upload'),
      file.folder.id,
    );
    await fs.mkdir(downloadDir, { recursive: true });
    const filename = path.join(downloadDir, file.name);
    let outPath = path.join(downloadDir, `${file.name.split('.')[0]}-preview`);
    outPath += file.videoType === VideoType.Video ? '.webm' : '.jpg';

    if (await fs.access(outPath).catch(() => true)) {
      const filenameStream = createWriteStream(filename);
      await this.getS3Object(file)
        .on('httpHeaders', (statusCode, headers, awsResponse) => {
          if (statusCode === 200) {
            (
              awsResponse.httpResponse.createUnbufferedStream() as Readable
            ).pipe(filenameStream);
          } else {
            throw new HttpException(
              awsResponse.error || awsResponse.httpResponse.statusMessage,
              awsResponse.httpResponse.statusCode,
            );
          }
        })
        .promise()
        .then(() => {
          this.logger.debug(`The file ${file.name} has been downloaded`);
        });
    }

    const { stderr } = await FfMpegPreview(
      file.videoType,
      file.meta.info!,
      filename,
      outPath,
    );
    if (stderr) {
      throw new BadRequestException();
    }

    const buffer = await fs.readFile(outPath);
    await Promise.all([
      this.fileRepository.update(file.id, {
        duration: file.meta.duration,
        width: file.meta.width,
        height: file.meta.height,
      }),
      this.filePreviewRepository.save(
        this.filePreviewRepository.create({
          ...file.preview,
          file,
          preview: Buffer.from(`\\x${buffer.toString('hex')}`),
        }),
      ),
    ]);

    return buffer;
  }

  async preview(type: VideoType, file: Express.Multer.File): Promise<Buffer> {
    let preview: Buffer;
    if (type === VideoType.Image) {
      const outPath = path.join(
        `${file.destination}/${file.filename}-preview.jpg`,
      );
      const { stderr } = await FfMpegPreview(
        type,
        file.media!,
        file.path,
        outPath,
      );
      if (stderr) {
        throw new BadRequestException();
      }

      preview = await fs.readFile(outPath);
    } else if (type === VideoType.Video) {
      const outPath = path.join(
        `${file.destination}/${file.filename}-preview.webm`,
      );
      const { stderr } = await FfMpegPreview(
        type,
        file.media!,
        file.path,
        outPath,
      );
      if (stderr) {
        throw new BadRequestException();
      }

      preview = await fs.readFile(outPath);
    } else {
      preview = Buffer.alloc(0);
    }

    return preview;
  }

  /**
   * Meta information
   * @param {Express.Multer.File} file The file
   * @return {[MediaMeta, VideoType, string, Buffer]} [MediaMeta, VideType, extension, preview]
   */
  async metaInformation(
    file: Express.Multer.File,
    category: FileCategory,
  ): Promise<[MediaMeta, VideoType, string, Buffer]> {
    const [mime] = file.mimetype.split('/');
    const extension = file.originalname.slice(
      file.originalname.lastIndexOf('.') + 1,
    );
    const type =
      Object.values(VideoType).find((t) => t === mime) ?? VideoType.Other;

    if (file.media) {
      const {
        media: { format: mediaFormat, streams },
      } = file;
      const { filename, ...format } = mediaFormat ?? {};
      const meta: MediaMeta = {
        filesize: Number(file.media.format?.size) || file.size,
        duration: parseFloat(`${file.media.format?.duration || 0}`),
        width:
          Number(file.media.format?.width) ||
          Number(file.media.streams?.[0].width) ||
          undefined,
        height:
          Number(file.media.format?.height) ||
          file.media.streams?.[0].height ||
          undefined,
        info: {
          format,
          streams,
        },
      };

      const preview = await this.preview(type, file);

      return [meta, type, extension, preview];
    }

    return [{ filesize: file.size }, type, extension, Buffer.alloc(0)];
  }
}
