import { createReadStream, promises as fs, createWriteStream } from 'node:fs';
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
  InternalServerErrorException,
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
  DeleteResult,
  In,
} from 'typeorm';

// import { isAWSError } from '@/shared/is-aws-error';
import { FileCategory, VideoType } from '@/enums';
import { FileUploadRequest } from '@/dto';
import { getS3Name } from '@/shared/get-name';
import { FfMpegPreview } from '@/shared/ffmpeg';
import { TypeOrmFind } from '@/shared/typeorm.find';
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

  private bucket: string;

  private region: string;

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
    this.region = configService.get<string>('AWS_REGION', 'ru-central1');
    this.bucket = configService.get<string>('AWS_BUCKET', 'myscreen-media');
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {Array<FileEntity>} {Array<FileEntity>} Результат
   */
  async find(
    find: FindManyOptions<FileEntity>,
    caseInsensitive = true,
  ): Promise<Array<FileEntity>> {
    const conditional = TypeOrmFind.Nullable(find);
    if (!find.relations) {
      conditional.relations = ['monitors', 'playlists'];
    }
    return caseInsensitive
      ? TypeOrmFind.findCI(this.fileRepository, conditional)
      : this.fileRepository.find(conditional);
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {[Array<FileEntity>, number]} {[Array<FileEntity>, number]} Результат
   */
  async findAndCount(
    find: FindManyOptions<FileEntity>,
    caseInsensitive = true,
  ): Promise<[Array<FileEntity>, number]> {
    const conditional = TypeOrmFind.Nullable(find);
    if (!find.relations) {
      conditional.relations = ['monitors', 'playlists'];
    }
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.fileRepository, conditional)
      : this.fileRepository.findAndCount(conditional);
  }

  /**
   * Get file
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {FileEntity} {FileEntity | undefined} Результат
   */
  async findOne(find: FindManyOptions<FileEntity>): Promise<FileEntity | null> {
    return find.relations
      ? this.fileRepository.findOne(TypeOrmFind.Nullable(find))
      : this.fileRepository.findOne({
          relations: ['monitors', 'playlists'],
          ...TypeOrmFind.Nullable(find),
        });
  }

  /**
   * Update file
   *
   * @async
   * @param {FileEntity} file File repository
   * @param {Partial<FileEntity>} {Partial<FileEntity>} File repository
   * @returns {FileEntity | undefined} {FileEntity | undefined} Результат
   */
  async update(
    file: FileEntity,
    update: Partial<FileEntity>,
  ): Promise<FileEntity> {
    return this.fileRepository.manager.transaction(async (fileRepository) => {
      if (update.folderId !== undefined && update.folderId !== file.folder.id) {
        const s3Name = getS3Name(file.name);
        const Key = `${update.folderId}/${file.hash}-${s3Name}`;
        const CopySource = `${file.folder.id}/${file.hash}-${s3Name}`;

        /* await */ this.s3Service
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
              }),
          )
          .catch((error) => {
            this.logger.error('S3 Error copyObject:', error);
          });

        return fileRepository.save(
          fileRepository.create<FileEntity>(FileEntity, update),
        );
      }

      return fileRepository.save<FileEntity>(
        fileRepository.create<FileEntity>(FileEntity, {
          ...update,
          id: file.id,
        }),
      );
    });
  }

  /**
   * Upload files
   * @async
   * @param {string} userId User ID
   * @param {FileUploadRequest} {FileUploadRequest} File upload request
   * @param {Array<Express.Multer.File>} {Array<Express.Multer.File>} files The Express files
   */
  async upload(
    userId: string,
    {
      folderId: folderIdp = undefined,
      category = FileCategory.Media,
      monitorId = undefined,
    }: FileUploadRequest,
    files: Array<Express.Multer.File>,
  ): Promise<Array<FileEntity>> {
    return this.fileRepository.manager.transaction(async (fileRepository) => {
      let folder: FolderEntity | null = null;
      if (!folderIdp) {
        folder = await this.folderService.rootFolder(userId);
      } else {
        folder =
          (await this.folderService.findOne({
            where: { userId, id: folderIdp },
          })) ?? null;
        if (!folder) {
          throw new NotFoundException(`Folder '${folderIdp}' not found`);
        }
      }
      const folderId = folder.id;

      let monitor: MonitorEntity | null = null;
      if (!monitorId && category !== FileCategory.Media) {
        throw new NotFoundException('monitorId is expected');
      }
      if (monitorId && category === FileCategory.Media) {
        throw new NotFoundException("Found category: 'media' and monitorId");
      }
      if (monitorId) {
        monitor =
          (await this.monitorService.findOne({
            where: { userId, id: monitorId },
          })) ?? null;
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
        const [meta, videoType, extension, preview] =
          await this.metaInformation(file);

        const media: DeepPartial<FileEntity> = {
          userId,
          folder: folder ?? undefined,
          name: file.originalname,
          filesize: meta.filesize,
          duration: meta.duration ?? 0,
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

        const update = await fileRepository.save(
          fileRepository.create<FileEntity>(FileEntity, media),
        );
        return fileRepository.findOneOrFail<FileEntity>(FileEntity, {
          where: { id: update.id },
        });
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

      return returnFiles;
    });
  }

  /**
   * Head request
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.HeadObjectOutput, AWS.AWSError>} S3 headers
   */
  async headS3Object(
    file: FileEntity,
  ): Promise<PromiseResult<AWS.S3.HeadObjectOutput, AWS.AWSError>> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service
      .headObject({
        Bucket: `${this.bucket}`,
        Key,
      })
      .promise()
      .then((fileUpdated) => {
        this.logger.debug(`The file '${file.id}' head on S3 '${Key}'`);
        return fileUpdated;
      });
  }

  /**
   * Get S3 object
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>} S3 object
   */
  getS3Object(
    file: FileEntity,
  ): AWS.Request<AWS.S3.GetObjectOutput, AWS.AWSError> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service.getObject({
      Bucket: this.bucket,
      Key,
    });
  }

  /**
   * Delete S3 object
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.DeleteObjectOutput, AWS.AWSError>} S3 object
   */
  async deleteS3Object(
    file: FileEntity,
  ): Promise<PromiseResult<AWS.S3.DeleteObjectOutput, AWS.AWSError>> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service
      .deleteObject({
        Bucket: this.bucket,
        Key,
      })
      .promise()
      .then((value) => {
        this.logger.debug(
          `The file '${Key}' has been deleted on S3: ${
            value.$response.data?.DeleteMarker || false
          }`,
        );
        return value;
      });
  }

  /**
   * Copy S3 object
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.CopyObjectOutput, AWS.AWSError>} S3 object copied
   */
  async copyS3Object(
    update: FolderEntity,
    file: FileEntity,
  ): Promise<PromiseResult<AWS.S3.CopyObjectOutput, AWS.AWSError>> {
    const s3Name = getS3Name(file.name);
    const Key = `${update.id}/${file.hash}-${s3Name}`;
    const CopySource = `${file.folder.id}/${file.hash}-${s3Name}`;

    return this.s3Service
      .copyObject({
        Bucket: this.bucket,
        Key,
        CopySource,
        MetadataDirective: 'REPLACE',
      })
      .promise()
      .then((fileUpdated) => {
        this.logger.debug(
          `The file has been copied on S3: from ${CopySource} to ${Key}`,
        );
        return fileUpdated;
      });
  }

  async copy(
    userId: string,
    toFolder: FolderEntity,
    originalFiles: FileEntity[],
  ): Promise<FileEntity[]> {
    return this.fileRepository.manager.transaction(async (fileRepository) => {
      const filePromises = originalFiles.map(async (file) => {
        await this.copyS3Object(toFolder, file).catch((error) => {
          this.logger.error(`S3 Error copyObject: ${JSON.stringify(error)}`);
        });

        const fileCopy = fileRepository.create(FileEntity, {
          ...file,
          userId,
          folderId: toFolder.id,
          folder: toFolder,
          id: undefined,
          preview: undefined,
          playlists: undefined,
          monitors: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        });
        return fileRepository.save(FileEntity, fileCopy);
      });

      return Promise.all(filePromises);
    });
  }

  async deletePrep(filesId: string[]): Promise<void> {
    const [editorFiles, playlistFiles] = await Promise.all([
      this.editorService.find({
        where: [
          {
            videoLayers: {
              file: {
                id: In(filesId),
              },
            },
          },
          {
            audioLayers: {
              file: {
                id: In(filesId),
              },
            },
          },
        ],
        select: {
          id: true,
          name: true,
          videoLayers: {
            id: true,
            file: {
              id: true,
            },
          },
          audioLayers: {
            id: true,
            file: {
              id: true,
            },
          },
        },
        relations: {
          videoLayers: {
            file: true,
          },
          audioLayers: {
            file: true,
          },
        },
        loadEagerRelations: false,
      }),
      this.playlistService.find({
        where: { files: { id: In(filesId) } },
        select: {
          id: true,
          name: true,
          files: { id: true },
        },
        relations: {
          files: true,
        },
        loadEagerRelations: false,
      }),
    ]);

    if (
      (editorFiles && Array.isArray(editorFiles) && editorFiles.length > 0) ||
      (playlistFiles &&
        Array.isArray(playlistFiles) &&
        playlistFiles.length > 0)
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
  }

  /**
   * Delete files
   * @async
   * @param {string} userId User ID
   * @param {string} filesId Files ID
   * @return {DeleteResult} {DeleteResult}
   */
  async delete(userId: string, filesId: string[]): Promise<DeleteResult> {
    const files = await this.fileRepository.find({
      where: { userId, id: In(filesId) },
    });

    /* await */ Promise.allSettled(
      files.map(async (file) =>
        this.headS3Object(file)
          .then(() =>
            this.deleteS3Object(file).catch((error) => {
              this.logger.error(
                `S3 Error deleteObject: ${JSON.stringify(error)}`,
              );
            }),
          )
          .catch((error) => {
            this.logger.error(
              `S3 Error headerObject: ${JSON.stringify(error)}`,
            );
          }),
      ),
    );

    return this.fileRepository.delete({
      id: In(files.map((file) => file.id)),
      userId,
    });
  }

  async previewFile(file: FileEntity): Promise<Buffer> {
    const downloadDir = this.configService.get<string>(
      'FILES_UPLOAD',
      'upload',
    );
    await fs.mkdir(downloadDir, { recursive: true });
    const filename = path.join(downloadDir, file.name);
    let outPath = path.join(
      downloadDir,
      `${path.parse(file.name).name}-preview`,
    );
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

    await FfMpegPreview(file.videoType, file.meta, filename, outPath).catch(
      (reason) => {
        throw new InternalServerErrorException(reason);
      },
    );
    // TODO: сделать что-нибудь с preview файлами

    return fs.readFile(outPath).then((buffer) => {
      this.filePreviewRepository.save(
        this.filePreviewRepository.create({
          ...file.preview,
          file,
          preview: Buffer.from(`\\x${buffer.toString('hex')}`),
        }),
      );

      return buffer;
    });
  }

  async preview(
    type: VideoType,
    file: Express.Multer.File,
    meta: MediaMeta,
  ): Promise<Buffer> {
    let preview: Buffer;
    if (type === VideoType.Image) {
      const outPath = path.join(
        `${file.destination}/${path.parse(file.filename).name}-preview.jpg`,
      );
      await FfMpegPreview(type, meta, file.path, outPath).catch((reason) => {
        throw new InternalServerErrorException(reason);
      });

      preview = await fs.readFile(outPath);
    } else if (type === VideoType.Video) {
      const outPath = path.join(
        `${file.destination}/${path.parse(file.filename).name}-preview.webm`,
      );
      await FfMpegPreview(type, meta, file.path, outPath).catch((reason) => {
        throw new InternalServerErrorException(reason);
      });

      preview = await fs.readFile(outPath);
    } else {
      preview = Buffer.alloc(0);
    }

    return preview;
  }

  /**
   * Meta information
   * @param {Express.Multer.File} file Express File
   * @return {[MediaMeta, VideoType, string, Buffer]} [MediaMeta, VideoType, string, Buffer]
   */
  private async metaInformation(
    file: Express.Multer.File,
  ): Promise<[MediaMeta, VideoType, string, Buffer]> {
    const [mime] = file.mimetype.split('/');
    const extension = path.parse(file.originalname).ext.slice(1);
    const type =
      Object.values(VideoType).find((t) => t === mime) ?? VideoType.Other;

    if (file.media) {
      const {
        media: { format: mediaFormat, streams },
      } = file;
      const { filename, ...format } = mediaFormat ?? {};
      const meta: MediaMeta = {
        filesize: Number(file.media.format?.size) || file.size,
        duration: parseFloat(
          `${
            file.media.format?.duration ??
            file.media.streams?.[0]?.duration ??
            0
          }`,
        ),
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

      const preview = await this.preview(type, file, meta);

      return [meta, type, extension, preview];
    }

    return [{ filesize: file.size }, type, extension, Buffer.alloc(0)];
  }
}
