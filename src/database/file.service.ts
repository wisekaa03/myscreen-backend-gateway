import { createHash } from 'node:crypto';
import {
  createReadStream,
  promises as fs,
  createWriteStream,
  ReadStream,
} from 'node:fs';
import internal from 'node:stream';
import StreamPromises from 'node:stream/promises';
import { join as pathJoin, parse as pathParse } from 'node:path';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
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
import { InjectS3, S3 } from 'nestjs-s3-aws';
import {
  Repository,
  FindManyOptions,
  DeepPartial,
  DeleteResult,
  In,
  EntityManager,
  IsNull,
} from 'typeorm';

import {
  ConflictData,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from '@/errors';
import { FileType } from '@/enums';
import {
  filePreviewAudio,
  filePreviewDOC,
  filePreviewOther,
  filePreviewPDF,
  filePreviewXLS,
  rootFolderName,
} from '@/constants';
import { getS3FullName, getS3Name } from '@/utils/get-s3-name';
import { FfMpegPreview } from '@/utils/ffmpeg-preview';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FileEntity } from '@/database/file.entity';
import { FilePreviewEntity } from '@/database/file-preview.entity';
import { EditorEntity } from './editor.entity';
import { PlaylistEntity } from './playlist.entity';
import { FolderEntity } from './folder.entity';
import { UserEntity } from './user.entity';
import { WsStatistics } from './ws.statistics';
import { FfprobeData } from 'media-probe';

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
    @Inject(forwardRef(() => WsStatistics))
    private readonly wsStatistics: WsStatistics,
    @InjectS3()
    private readonly s3Service: S3,
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
    @InjectRepository(PlaylistEntity)
    private readonly playlistRepository: Repository<PlaylistEntity>,
    @InjectRepository(FilePreviewEntity)
    private readonly filePreviewRepository: Repository<FilePreviewEntity>,
  ) {
    this.frontEndUrl = this.configService.get(
      'FRONTEND_URL',
      'https://cp.myscreen.ru',
    );
    this.downloadDir = configService.getOrThrow('FILES_UPLOAD');

    this.region = configService.getOrThrow('AWS_REGION');
    this.bucket = configService.getOrThrow('AWS_BUCKET');
    // 7 days
    this.signedUrlExpiresIn = parseInt(
      configService.getOrThrow('AWS_SIGNED_URL_EXPIRES'),
      10,
    );
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
  }): Promise<FileEntity[]> {
    const conditional = TypeOrmFind.findParams(FileEntity, find);
    if (find.relations === undefined) {
      conditional.relations = {};
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
  }): Promise<[FileEntity[], number]> {
    const conditional = TypeOrmFind.findParams(FileEntity, find);
    if (find.relations === undefined) {
      conditional.relations = {};
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
    const conditional = TypeOrmFind.findParams(FileEntity, find);
    if (find.relations === undefined) {
      conditional.relations = {};
    }

    const file = caseInsensitive
      ? await TypeOrmFind.findOneCI(this.fileRepository, conditional)
      : await this.fileRepository.findOne(conditional);
    if (!file) {
      return null;
    }

    return signedUrl ? this.signedUrl(file) : file;
  }

  async sum(userId: string): Promise<number> {
    return this.fileRepository
      .sum('filesize', { userId })
      .then((sum: number | null) => sum ?? 0);
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

  async createFolder(
    folder: Partial<FolderEntity>,
    _transact?: EntityManager,
  ): Promise<FolderEntity> {
    const transact = _transact
      ? _transact.withRepository(this.folderRepository)
      : this.folderRepository;

    const created = await transact.save(folder);
    if (!created) {
      throw new NotFoundError('Error when creating folder');
    }

    return created;
  }

  async rootFolder(
    userId: string,
    _transact?: EntityManager,
  ): Promise<FolderEntity> {
    const transact = _transact
      ? _transact.withRepository(this.folderRepository)
      : this.folderRepository;

    let folder = await transact.findOne({
      where: { parentFolder: IsNull(), userId },
    });

    if (!folder) {
      folder = await this.createFolder(
        {
          name: rootFolderName,
          parentFolderId: null,
          userId,
          system: true,
        },
        _transact,
      );
    }

    return folder;
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
    return this.fileRepository.manager.transaction(
      'REPEATABLE READ',
      async (transact) => {
        const s3Name = getS3Name(file.name);
        const CopySource = `${file.folderId}/${file.hash}-${s3Name}`;
        let Key = `${file.folderId}/${file.hash}-${s3Name}`;
        if (
          update.folderId !== undefined &&
          update.folderId !== file.folderId
        ) {
          if (update.name !== undefined && update.name !== file.name) {
            const s3NameUpdated = getS3Name(update.name);
            Key = `${update.folderId}/${file.hash}-${s3NameUpdated}`;
          } else {
            Key = `${update.folderId}/${file.hash}-${s3Name}`;
          }
        } else if (update.name !== undefined && update.name !== file.name) {
          const s3NameUpdated = getS3Name(update.name);
          Key = `${file.folderId}/${file.hash}-${s3NameUpdated}`;
        }

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

        await transact.update(FileEntity, file.id, {
          folderId: update?.folderId,
          name: update?.name,
        });
        const data = await transact.findOneByOrFail(FileEntity, {
          id: file.id,
        });

        await this.wsStatistics.onChange({ files: [data] });

        return data;
      },
    );
  }

  /**
   * Upload files
   * @async
   * @param {UserEntity} user User ID
   * @param {Express.Multer.File[] | Express.Multer.File | Buffer} files File upload request
   * @param {string} folderId Folder ID
   * @param {string} originalname Original name of the file
   */
  async upload(param: {
    user: UserEntity;
    files: Express.Multer.File[] | Express.Multer.File | Buffer;
    folderId?: string;
    originalname?: string;
    mimetype?: string;
    info?: FfprobeData;
    transact?: EntityManager;
  }): Promise<FileEntity[]> {
    const {
      user,
      files: _files,
      folderId: _folderId,
      originalname: _originalname,
      mimetype: _mimetype,
      info: _info,
      transact,
    } = param;
    let files: Express.Multer.File[];
    if (Array.isArray(_files)) {
      files = _files;
    } else if (Buffer.isBuffer(_files)) {
      const hashFunc = createHash('md5');
      hashFunc.update(_files);
      const _hash = hashFunc.digest('hex');
      files = [
        {
          originalname: _originalname,
          size: _files.length,
          media: _info,
          mimetype: _mimetype,
          buffer: _files,
          hash: _hash,
        } as Express.Multer.File,
      ];
    } else {
      files = [_files];
    }
    const transactFolder = transact
      ? transact.withRepository(this.folderRepository)
      : this.folderRepository;
    const transactFile = transact
      ? transact.withRepository(this.fileRepository)
      : this.fileRepository;

    const { id: userId } = user;
    let folderId: string;
    if (_folderId) {
      const folder = await transactFolder.findOne({
        where: { userId, id: _folderId },
        select: ['id'],
      });
      if (!folder) {
        throw new NotFoundError(`Folder '${_folderId}' not found`);
      }
      folderId = folder.id;
    } else {
      folderId = (await this.rootFolder(userId, transact)).id;
    }

    return transactFile.manager.transaction(
      'REPEATABLE READ',
      async (transact) => {
        const filesPromises = files.map(async (file) => {
          const {
            mimetype,
            originalname,
            path,
            media: info,
            size: filesize,
            buffer,
          } = file;
          const { hash } = file;
          let filesBuffer: ReadStream | Buffer;
          if (Buffer.isBuffer(buffer)) {
            filesBuffer = buffer;
          } else {
            filesBuffer = createReadStream(path);
          }

          const [mime] = mimetype.split('/');
          const extension = pathParse(originalname).ext.slice(1);
          const fileType =
            Object.values(FileType).find((t) => t === mime) ?? FileType.OTHER;

          const stream = info?.streams?.[0];
          let duration = 0;
          let width = 0;
          let height = 0;
          if (stream) {
            duration = Number(stream.duration ?? 0);
            width = Number(stream.width ?? 0);
            height = Number(stream.height ?? 0);
          }

          const fileToSave: DeepPartial<FileEntity> = {
            userId,
            folderId,
            name: originalname,
            filesize,
            duration,
            width,
            height,
            info,
            videoType: fileType,
            type: fileType,
            extension,
            hash,
            preview: undefined,
          };

          const Key = `${folderId}/${hash}-${getS3Name(originalname)}`;
          try {
            const uploaded = await this.s3Service.putObject({
              Bucket: this.bucket,
              Key,
              ContentType: mimetype,
              Body: filesBuffer,
            });
            this.logger.warn(
              `S3: the file "${originalname}" uploaded to "${Key}": ${JSON.stringify(uploaded)}`,
            );
          } catch (error: unknown) {
            this.logger.error(
              `S3 upload error: "${JSON.stringify(error)}"`,
              error,
            );
            throw new InternalServerError(error);
          }

          const fileUpdated = await transact.save(
            FileEntity,
            transact.create(FileEntity, fileToSave),
          );

          return fileUpdated;
        });

        const filesDatabase = await Promise.all(filesPromises);

        await this.wsStatistics.onMetrics(user);

        return filesDatabase;
      },
    );
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
        this.logger.warn(
          `S3: "${file.name}" has been deleted: ${JSON.stringify(value) ?? true}`,
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
    transact?: EntityManager,
  ): Promise<FileEntity[]> {
    const copyFiles = (transact: EntityManager) => {
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
    };

    if (transact) {
      return copyFiles(transact);
    }

    return this.fileRepository.manager.transaction(
      'REPEATABLE READ',
      async (transact) => copyFiles(transact),
    );
  }

  async deletePrep(filesId: string[]): Promise<void> {
    const [videoFiles, audioFiles, playlistFiles] = await Promise.all([
      this.editorRepository.find({
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
      this.editorRepository.find({
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
      this.playlistRepository.find({
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
      videoFiles.length === 0 &&
      audioFiles.length === 0 &&
      playlistFiles.length === 0
    ) {
      return;
    }

    const errorMsg: ConflictData = {};
    errorMsg.video = videoFiles.map((editor) => ({
      id: editor.id,
      name: editor.name,
      file: editor.videoLayers.map((layer) => layer.file).at(0),
    }));
    errorMsg.audio = audioFiles.map((editor) => ({
      id: editor.id,
      name: editor.name,
      file: editor.audioLayers.map((layer) => layer.file).at(0),
    }));
    errorMsg.playlist = playlistFiles.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      file: playlist.files.find((file) => filesId.includes(file.id)),
    }));
    throw new ConflictError('CONFLICT_ERROR', {}, errorMsg);
  }

  /**
   * Delete files
   * @async
   * @param {string} filesId Files ID
   * @return {DeleteResult} {DeleteResult}
   */
  async delete(filesId: string[]): Promise<DeleteResult> {
    const files = await this.fileRepository.find({
      where: { id: In(filesId) },
      relations: { folder: true },
    });
    if (files.length === 0) {
      return { affected: 0, raw: 0 };
    }

    await this.wsStatistics.onChange({ filesDelete: files });

    const filesS3DeletePromise = files.map(async (file) => {
      this.deleteS3Object(file).catch((error: unknown) => {
        this.logger.error(`S3 Error deleteObject: ${JSON.stringify(error)}`);
      });
    });
    await Promise.allSettled(filesS3DeletePromise);

    const filesDeleteId = files.map(({ id }) => id);
    const filesDelete = await this.fileRepository.delete({
      id: In(filesDeleteId),
    });
    return filesDelete;
  }

  /**
   * Скачивает предпросмотр файла
   *
   * @param {FileEntity} file FileEntity with PreviewEntity
   * @returns Buffer preview
   */
  async downloadPreviewFile(file: FileEntity): Promise<Buffer> {
    await fs.mkdir(this.downloadDir, { recursive: true });
    const filename = pathJoin(this.downloadDir, file.name);
    const filenameParsed = pathParse(filename);
    const { name, ext } = filenameParsed;
    let outPath = pathJoin(this.downloadDir, `${name}-preview`);
    if (file.type === FileType.VIDEO) {
      outPath += '.webm';
    } else if (file.type === FileType.IMAGE) {
      outPath += '.jpg';
    } else if (file.type === FileType.AUDIO) {
      return Buffer.from(filePreviewAudio);
    } else if (file.type === FileType.OTHER) {
      if (ext === '.xlsx' || ext === '.xls' || ext === '.ods') {
        return Buffer.from(filePreviewXLS);
      } else if (ext === '.docx' || ext === '.doc' || ext === '.odt') {
        return Buffer.from(filePreviewDOC);
      } else if (ext === '.pdf') {
        return Buffer.from(filePreviewPDF);
      }
      return Buffer.from(filePreviewOther);
    }

    if (await fs.access(outPath).catch(() => true)) {
      const outputStream = createWriteStream(filename);
      const data: GetObjectCommandOutput = await this.getS3Object(file).catch(
        (error: unknown) => {
          this.logger.error(
            `S3 Error preview: "${file.name}" (${getS3FullName(file)})`,
            error,
          );
          throw new NotFoundError(error);
        },
      );
      if (data.Body instanceof internal.Readable) {
        await StreamPromises.pipeline(data.Body, outputStream);
        this.logger.debug(`The file "${file.name}" has been downloaded`);
        await FfMpegPreview(
          file.type,
          file.info || {},
          filename,
          outPath,
        ).catch((reason: unknown) => {
          throw new InternalServerError(reason);
        });
      } else {
        throw new InternalServerError('S3 data is not readable');
      }
    } else {
      this.logger.debug(`Preview file "${file.name}" has cached`);
    }

    const preview = await fs.readFile(outPath);

    const id = file.preview?.id;
    if (id) {
      await this.filePreviewRepository.update(id, { preview });
    } else {
      await this.filePreviewRepository.insert({ fileId: file.id, preview });
    }

    return preview;
  }
}
