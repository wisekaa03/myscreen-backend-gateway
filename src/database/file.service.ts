import { createReadStream, promises as fs, createWriteStream } from 'node:fs';
import internal from 'node:stream';
import StreamPromises from 'node:stream/promises';
import { join as pathJoin, parse as pathParse } from 'node:path';
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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CopyObjectOutput,
  DeleteObjectOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectS3, S3 } from 'nestjs-s3';
import {
  Repository,
  FindManyOptions,
  DeepPartial,
  DeleteResult,
  In,
  FindOptionsWhere,
} from 'typeorm';

import { FileCategory, UserRoleEnum, VideoType } from '@/enums';
import { ConflictData, FileUploadRequest } from '@/dto';
import { EditorService } from '@/database/editor.service';
import { getS3FullName, getS3Name } from '@/utils/get-name';
import { FfMpegPreview } from '@/utils/ffmpeg-preview';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FileEntity } from '@/database/file.entity';
import { FilePreviewEntity } from '@/database/file-preview.entity';
import { FolderService } from '@/database/folder.service';
import { MonitorService } from '@/database/monitor.service';
import { MonitorEntity } from './monitor.entity';
import { FolderEntity } from './folder.entity';
import { PlaylistService } from './playlist.service';
import { UserEntity } from './user.entity';
import { RequestService } from './request.service';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);

  private bucket: string;

  private region: string;

  public downloadDir: string;

  public frontEndUrl: string;

  private signedUrlExpiresIn: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RequestService))
    private readonly requestService: RequestService,
    @Inject(forwardRef(() => FolderService))
    private readonly folderService: FolderService,
    @Inject(forwardRef(() => MonitorService))
    private readonly monitorService: MonitorService,
    @Inject(forwardRef(() => EditorService))
    private readonly editorService: EditorService,
    private readonly playlistService: PlaylistService,
    @InjectS3()
    private readonly s3Service: S3,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(FilePreviewEntity)
    private readonly filePreviewRepository: Repository<FilePreviewEntity>,
  ) {
    this.frontEndUrl = this.configService.get(
      'FRONTEND_URL',
      'https://cp.myscreen.ru',
    );
    this.downloadDir = configService.get('FILES_UPLOAD', 'upload');

    this.region = configService.get('AWS_REGION', 'ru-central1');
    this.bucket = configService.get('AWS_BUCKET', 'myscreen-media');
    this.signedUrlExpiresIn = parseInt(
      configService.get('AWS_SIGNED_URL_EXPIRES', `${60 * 60 * 24 * 7}`),
      10,
    ); // 7 days
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {Array<FileEntity>} {Array<FileEntity>} Результат
   */
  async find({
    find,
    caseInsensitive = true,
    signedUrl = true,
  }: {
    find: FindManyOptions<FileEntity>;
    caseInsensitive?: boolean;
    signedUrl?: boolean;
  }): Promise<Array<FileEntity>> {
    const conditional = TypeOrmFind.findParams(find);
    if (find.relations === undefined) {
      conditional.relations = { monitors: true, playlists: true };
    }

    const files = caseInsensitive
      ? await TypeOrmFind.findCI(this.fileRepository, conditional)
      : await this.fileRepository.find(conditional);

    if (files.length <= 0) {
      return files;
    }

    return signedUrl
      ? Promise.all(files.map(async (file) => this.signedUrl(file)))
      : files;
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {[Array<FileEntity>, number]} {[Array<FileEntity>, number]} Результат
   */
  async findAndCount({
    find,
    caseInsensitive = true,
    signedUrl = true,
  }: {
    find: FindManyOptions<FileEntity>;
    caseInsensitive?: boolean;
    signedUrl?: boolean;
  }): Promise<[Array<FileEntity>, number]> {
    const conditional = TypeOrmFind.findParams(find);
    if (find.relations === undefined) {
      conditional.relations = { monitors: true, playlists: true };
    }
    const files = caseInsensitive
      ? await TypeOrmFind.findAndCountCI(this.fileRepository, conditional)
      : await this.fileRepository.findAndCount(conditional);

    if (files[1] <= 0) {
      return files;
    }

    return signedUrl
      ? [
          await Promise.all(files[0].map(async (file) => this.signedUrl(file))),
          files[1],
        ]
      : files;
  }

  /**
   * Get file
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {FileEntity} {FileEntity | undefined} Результат
   */
  async findOne({
    find,
    caseInsensitive = true,
    signedUrl = true,
  }: {
    find: FindManyOptions<FileEntity>;
    caseInsensitive?: boolean;
    signedUrl?: boolean;
  }): Promise<FileEntity | null> {
    const conditional = TypeOrmFind.findParams(find);
    if (find.relations === undefined) {
      conditional.relations = { monitors: true, playlists: true };
    }

    const file = caseInsensitive
      ? await TypeOrmFind.findOneCI(this.fileRepository, conditional)
      : await this.fileRepository.findOne(conditional);
    if (!file) {
      return null;
    }

    return signedUrl ? this.signedUrl(file) : file;
  }

  async signedUrl(file: FileEntity): Promise<FileEntity> {
    const getObject = new GetObjectCommand({
      Bucket: this.bucket,
      Key: getS3FullName(file),
    });

    const signedUrl = await getSignedUrl(this.s3Service, getObject, {
      expiresIn: this.signedUrlExpiresIn,
    });

    return {
      ...file,
      signedUrl,
    } as FileEntity;
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
    return this.fileRepository.manager.transaction(async (transact) => {
      if (update.folderId !== undefined && update.folderId !== file.folder.id) {
        const s3Name = getS3Name(file.name);
        const Key = `${update.folderId}/${file.hash}-${s3Name}`;
        const CopySource = `${file.folderId}/${file.hash}-${s3Name}`;

        await this.s3Service
          .copyObject({
            Bucket: this.bucket,
            Key,
            CopySource: `${this.bucket}/${CopySource}`,
            MetadataDirective: 'REPLACE',
          })
          .then(() =>
            this.s3Service.deleteObject({
              Bucket: this.bucket,
              Key: CopySource,
            }),
          );

        const data = await transact.save(
          FileEntity,
          transact.create(FileEntity, { ...file, ...update, id: file.id }),
        );

        await this.requestService.websocketChange({ files: [data] });

        return data;
      }

      return transact.save(
        FileEntity,
        transact.create(FileEntity, { ...update, id: file.id }),
      );
    });
  }

  /**
   * Upload files
   * @async
   * @param {UserEntity} user User ID
   * @param {FileUploadRequest} {FileUploadRequest} File upload request
   * @param {Array<Express.Multer.File>} {Array<Express.Multer.File>} files The Express files
   */
  async upload(
    user: UserEntity,
    {
      folderId: folderIdOrig = undefined,
      category = FileCategory.Media,
      monitorId = undefined,
    }: FileUploadRequest,
    files: Array<Express.Multer.File>,
  ): Promise<Array<FileEntity>> {
    return this.fileRepository.manager.transaction(async (transact) => {
      let folder: FolderEntity | null = null;
      if (!folderIdOrig) {
        folder = await this.folderService.rootFolder(user);
      } else {
        folder =
          (await this.folderService.findOne({
            where: { userId: user.id, id: folderIdOrig },
          })) ?? null;
        if (!folder) {
          throw new NotFoundException(`Folder '${folderIdOrig}' not found`);
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
        monitor = await this.monitorService.findOne({
          find: {
            where: { id: monitorId },
            loadEagerRelations: false,
            relations: {},
          },
        });
        if (!monitor) {
          throw new NotFoundException(`Monitor "${monitorId}" not found`);
        }
      }
      if (!monitor && category !== FileCategory.Media) {
        throw new BadRequestException('monitorId is expected');
      }
      if (monitor && category === FileCategory.Media) {
        throw new BadRequestException("Found category: 'media' and monitorId");
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
        if (!file.media) {
          throw new BadRequestException(
            `'${file.originalname}' has no data in Ffprobe`,
          );
        }
        const { mimetype, originalname, media, size } = file;

        const [mime] = mimetype.split('/');
        const extension = pathParse(originalname).ext.slice(1);
        const type =
          Object.values(VideoType).find((t) => t === mime) ?? VideoType.Other;

        const stream = media.streams?.[0];
        const duration = parseFloat(stream?.duration ?? '0');
        const width = Number(stream?.width) ?? 0;
        const height = Number(stream?.height) ?? 0;

        const fileToSave: DeepPartial<FileEntity> = {
          userId: user.id,
          folder: folder ?? undefined,
          name: file.originalname,
          filesize: size,
          duration,
          width,
          height,
          info: media,
          videoType: type,
          category,
          extension,
          hash: file.hash,
          preview: undefined,
          monitors: monitorId ? [{ id: monitorId }] : undefined,
        };

        const Key = `${folderId}/${file.hash}-${getS3Name(file.originalname)}`;
        try {
          const fileUploaded = await this.s3Service.putObject({
            Bucket: this.bucket,
            Key,
            ContentType: file.mimetype,
            Body: createReadStream(file.path),
          });
          if (!fileUploaded) {
            throw new Error('Failed to upload');
          }
          this.logger.debug(
            `S3: the file "${file.path}" uploaded to "${Key}": ${JSON.stringify(
              fileUploaded,
            )}`,
          );
        } catch (error: any) {
          this.logger.error(`S3 upload error: "${error?.toString()}"`, error);
          throw new InternalServerErrorException(error);
        }

        return transact.save(
          FileEntity,
          transact.create(FileEntity, fileToSave),
        );
      });

      return Promise.all(filesPromises);
    });
  }

  /**
   * Head request
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.HeadObjectOutput, AWS.AWSError>} S3 headers
   */
  async headS3Object(file: FileEntity): Promise<HeadObjectOutput> {
    return this.s3Service
      .headObject({
        Bucket: this.bucket,
        Key: getS3FullName(file),
      })
      .then((value) => {
        this.logger.debug(
          `S3 head: file "${file.name}": ${JSON.stringify(value)}`,
        );
        return value;
      })
      .catch((error: any) => {
        throw new HttpException(
          `S3 head error: "${file.name}" ${error?.code ?? 'Not found'}`,
          error?.statusCode ?? 404,
        );
      });
  }

  /**
   * Get S3 object
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>} S3 object
   */
  getS3Object(file: FileEntity): Promise<GetObjectCommandOutput> {
    return this.s3Service.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: getS3FullName(file),
      }),
    );
  }

  /**
   * Delete S3 object
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.DeleteObjectOutput, AWS.AWSError>} S3 object
   */
  async deleteS3Object(file: FileEntity): Promise<DeleteObjectOutput> {
    return this.s3Service
      .deleteObject({
        Bucket: this.bucket,
        Key: getS3FullName(file),
      })
      .then((value) => {
        this.logger.debug(
          `S3: "${file.name}" has been deleted: ${value.DeleteMarker ?? true}`,
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
    { id }: FolderEntity,
    { name, hash, folderId }: FileEntity,
  ): Promise<CopyObjectOutput> {
    const s3Name = getS3Name(name);
    const Key = `${id}/${hash}-${s3Name}`;
    const CopySource = `${folderId}/${hash}-${s3Name}`;

    return this.s3Service
      .copyObject({
        Bucket: this.bucket,
        CopySource: `/${this.bucket}/${CopySource}`,
        Key,
        MetadataDirective: 'REPLACE',
      })
      .then((fileUpdated) => {
        this.logger.debug(`S3 copy: from "${CopySource}" to "${Key}"`);
        return fileUpdated;
      });
  }

  async copy(
    userId: string,
    toFolder: FolderEntity,
    originalFiles: FileEntity[],
  ): Promise<FileEntity[]> {
    return this.fileRepository.manager.transaction(async (transact) => {
      const filePromises = originalFiles.map(async (file) => {
        await this.copyS3Object(toFolder, file);

        const fileCopy = transact.create(FileEntity, {
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
        return transact.save(FileEntity, fileCopy);
      });

      return Promise.all(filePromises);
    });
  }

  async deletePrep(filesId: string[]): Promise<void> {
    const [videoFiles, audioFiles, playlistFiles] = await Promise.all([
      this.editorService.find({
        where: [
          {
            videoLayers: {
              file: { id: In(filesId) },
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
              name: true,
            },
          },
        },
        relations: {
          videoLayers: {
            file: true,
          },
        },
        loadEagerRelations: false,
      }),
      this.editorService.find({
        where: [
          {
            audioLayers: {
              file: { id: In(filesId) },
            },
          },
        ],
        select: {
          id: true,
          name: true,
          audioLayers: {
            id: true,
            file: {
              id: true,
              name: true,
            },
          },
        },
        relations: {
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
          files: {
            id: true,
            name: true,
          },
        },
        relations: {
          files: true,
        },
        loadEagerRelations: false,
      }),
    ]);

    if (
      (Array.isArray(videoFiles) && videoFiles.length > 0) ||
      (Array.isArray(audioFiles) && audioFiles.length > 0) ||
      (Array.isArray(playlistFiles) && playlistFiles.length > 0)
    ) {
      const errorMsg = {} as ConflictData;
      if (Array.isArray(videoFiles) && videoFiles.length > 0) {
        errorMsg.video = videoFiles.map((editor) => ({
          id: editor.id,
          name: editor.name,
          file: editor.videoLayers.map((layer) => layer.file)?.pop(),
        }));
      }
      if (Array.isArray(audioFiles) && audioFiles.length > 0) {
        errorMsg.audio = audioFiles.map((editor) => ({
          id: editor.id,
          name: editor.name,
          file: editor.audioLayers.map((layer) => layer.file)?.pop(),
        }));
      }
      if (Array.isArray(playlistFiles) && playlistFiles.length > 0) {
        errorMsg.playlist = playlistFiles.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          file: playlist.files?.find((file) => filesId.includes(file.id)),
        }));
      }
      throw new ConflictException(errorMsg);
    }
  }

  /**
   * Delete files
   * @async
   * @param {UserEntity} user User
   * @param {string} filesId Files ID
   * @return {DeleteResult} {DeleteResult}
   */
  async delete(user: UserEntity, filesId: string[]): Promise<DeleteResult> {
    const where: FindOptionsWhere<FileEntity> = { id: In(filesId) };
    if (user.role !== UserRoleEnum.Administrator) {
      where.userId = user.id;
    }
    const files = await this.fileRepository.find({
      where,
      relations: ['folder'],
    });

    await this.requestService.websocketChange({ files, filesDelete: true });

    // TODO: хм
    await Promise.allSettled(
      files.map(async (file) => {
        this.headS3Object(file).then(() => {
          this.deleteS3Object(file).catch((error) => {
            this.logger.error(
              `S3 Error deleteObject: ${JSON.stringify(error)}`,
            );
          });
        });
      }),
    );

    return this.fileRepository.delete({
      id: In(files.map((file) => file.id)),
      userId: user.id,
    });
  }

  async downloadPreviewFile(file: FileEntity): Promise<Buffer> {
    await fs.mkdir(this.downloadDir, { recursive: true });
    const filename = pathJoin(this.downloadDir, file.name);
    let outPath = pathJoin(
      this.downloadDir,
      `${pathParse(file.name).name}-preview`,
    );
    outPath += file.videoType === VideoType.Video ? '.webm' : '.jpg';

    if (await fs.access(outPath).catch(() => true)) {
      const outputStream = createWriteStream(filename);
      const data: GetObjectCommandOutput = await this.getS3Object(file).catch(
        (error: unknown) => {
          this.logger.error(
            `S3 Error preview: "${file.name}" (${getS3FullName(file)})`,
            error,
          );
          throw new InternalServerErrorException(error);
        },
      );
      if (data.Body instanceof internal.Readable) {
        await StreamPromises.pipeline(data.Body, outputStream);
        this.logger.debug(`The file "${file.name}" has been downloaded`);
        await FfMpegPreview(
          file.videoType,
          file.info || {},
          filename,
          outPath,
        ).catch((reason: unknown) => {
          throw new InternalServerErrorException(reason);
        });
      } else {
        throw new InternalServerErrorException('S3 data is not readable');
      }
    } else {
      this.logger.debug(`Preview file "${file.name}" has cached`);
    }

    const preview = await fs.readFile(outPath);

    await this.filePreviewRepository.save(
      this.filePreviewRepository.create({
        ...file.preview,
        file,
        preview,
      }),
    );

    return preview;
  }
}
