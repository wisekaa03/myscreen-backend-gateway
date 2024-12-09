import { createHash } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  promises as fs,
  ReadStream,
} from 'node:fs';
import { Readable } from 'node:stream';
import StreamPromises from 'node:stream/promises';
import { join as pathJoin, parse as pathParse } from 'node:path';
import { rimraf } from 'rimraf';
import type { Response as ExpressResponse } from 'express';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
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
  DeepPartial,
  DeleteResult,
  In,
  EntityManager,
  IsNull,
} from 'typeorm';
import type { FfprobeData } from 'fluent-ffmpeg';

import {
  ConflictData,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from '@/errors';
import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
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
import { TypeOrmFind } from '@/utils/typeorm.find';
import { fileExist } from '@/utils/file-exist';
import { FileEntity } from '@/database/file.entity';
import { FilePreviewEntity } from '@/database/file-preview.entity';
import { EditorEntity } from './editor.entity';
import { PlaylistEntity } from './playlist.entity';
import { FolderEntity } from './folder.entity';
import { WsStatistics } from './ws.statistics';
import { FileExtView } from './file-ext.view';
import { I18nPath } from '@/i18n';
import { FfMpegPreview } from '@/utils/ffmpeg-preview';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);

  private bucket: string;

  public downloadDir: string;

  public frontEndUrl: string;

  private signedUrlExpiresIn: number;

  private filePreviewAudio: Buffer;
  private filePreviewAudioLength: number;

  private filePreviewXlsx: Buffer;
  private filePreviewXlsxLength: number;

  private filePreviewDocx: Buffer;
  private filePreviewDocxLength: number;

  private filePreviewPDF: Buffer;
  private filePreviewPDFLength: number;

  private filePreviewOther: Buffer;
  private filePreviewOtherLength: number;

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
    @InjectRepository(FileExtView)
    private readonly fileExtRepository: Repository<FileExtView>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    this.frontEndUrl = this.configService.get(
      'FRONTEND_URL',
      'https://cp.myscreen.ru',
    );
    this.downloadDir = configService.getOrThrow('FILES_UPLOAD');

    this.bucket = configService.getOrThrow('AWS_BUCKET');
    // 7 days
    this.signedUrlExpiresIn = parseInt(
      configService.getOrThrow('AWS_SIGNED_URL_EXPIRES'),
      10,
    );

    this.filePreviewAudio = Buffer.from(filePreviewAudio);
    this.filePreviewAudioLength = this.filePreviewAudio.length;

    this.filePreviewXlsx = Buffer.from(filePreviewXLS);
    this.filePreviewXlsxLength = this.filePreviewXlsx.length;

    this.filePreviewDocx = Buffer.from(filePreviewDOC);
    this.filePreviewDocxLength = this.filePreviewDocx.length;

    this.filePreviewPDF = Buffer.from(filePreviewPDF);
    this.filePreviewPDFLength = this.filePreviewPDF.length;

    this.filePreviewOther = Buffer.from(filePreviewOther);
    this.filePreviewOtherLength = this.filePreviewOther.length;
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {Array<FileEntity>} {Array<FileEntity>} Результат
   */
  async find({
    caseInsensitive = true,
    signedUrl = true,
    transact: _transact,
    ...find
  }: FindManyOptionsExt<FileEntity>): Promise<FileExtView[]> {
    const conditional = TypeOrmFind.findParams<FileExtView>(FileEntity, find);
    if (find.relations === undefined) {
      conditional.relations = {};
    }

    const transact = _transact
      ? _transact.withRepository(this.fileExtRepository)
      : this.fileExtRepository;

    const files = caseInsensitive
      ? await TypeOrmFind.findCI(transact, conditional)
      : await transact.find(conditional);

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
    caseInsensitive = true,
    signedUrl = true,
    transact: _transact,
    ...find
  }: FindManyOptionsExt<FileEntity>): Promise<[FileExtView[], number]> {
    const conditional = TypeOrmFind.findParams<FileExtView>(FileEntity, find);
    if (find.relations === undefined) {
      conditional.relations = {};
    }

    const transact = _transact
      ? _transact.withRepository(this.fileExtRepository)
      : this.fileExtRepository;

    const files = caseInsensitive
      ? await TypeOrmFind.findAndCountCI(transact, conditional)
      : await transact.findAndCount(conditional);

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
    caseInsensitive = true,
    signedUrl = true,
    transact: _transact,
    ...find
  }: FindOneOptionsExt<FileEntity>): Promise<FileExtView | null> {
    const conditional = TypeOrmFind.findParams<FileExtView>(FileEntity, find);
    if (find.relations === undefined) {
      conditional.relations = {};
    }

    const transact = _transact
      ? _transact.withRepository(this.fileExtRepository)
      : this.fileExtRepository;

    const file = caseInsensitive
      ? await TypeOrmFind.findOneCI(transact, conditional)
      : await transact.findOne(conditional);
    if (!file) {
      return null;
    }

    return signedUrl ? this.signedUrl(file) : file;
  }

  async sum({
    userId,
    transact: _transact,
  }: {
    userId: string;
    transact?: EntityManager;
  }): Promise<number> {
    const transact = _transact
      ? _transact.withRepository(this.fileRepository)
      : this.fileRepository;

    return transact
      .sum('filesize', { userId })
      .then((sum: number | null) => sum ?? 0);
  }

  async signedUrl<T extends FileEntity>(file: T): Promise<T> {
    const getObject = new GetObjectCommand({
      Bucket: this.bucket,
      Key: getS3FullName(file),
    });

    file.signedUrl = await getSignedUrl(this.s3Service, getObject, {
      expiresIn: this.signedUrlExpiresIn,
    });

    return file;
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
    update: Partial<FileExtView>,
  ): Promise<FileExtView> {
    return this.entityManager.transaction(
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

        const data = await this.s3Service
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
          )
          .then(() =>
            transact.update(FileEntity, file.id, {
              folderId: update?.folderId,
              name: update?.name,
            }),
          )
          .then(() =>
            this.findOne({
              where: { id: file.id },
              transact,
            }),
          )
          .then((files) => {
            if (!files) {
              throw new ServiceUnavailableError();
            }
            return files;
          })
          .catch((error: unknown) => {
            this.logger.error(`S3 error: ${JSON.stringify(error)}`);
            throw new NotFoundError(`S3 error: ${JSON.stringify(error)}`);
          });

        await this.wsStatistics.onChangeFiles({ files: [data] });

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
  async upload({
    userId,
    storageSpace,
    files: _files,
    folderId: _folderId,
    originalname: _originalname,
    mimetype: _mimetype,
    info: _info,
    transact: _transact,
  }: {
    userId: string;
    storageSpace?: string;
    files: Express.Multer.File[] | Express.Multer.File | Buffer;
    folderId?: string;
    originalname?: string;
    mimetype?: string;
    info?: FfprobeData;
    transact?: EntityManager;
  }): Promise<FileExtView[]> {
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

    const transact = _transact ?? this.entityManager;

    let folderId: string;
    if (_folderId) {
      const folder = await transact.findOne(FolderEntity, {
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

    return transact.transaction('REPEATABLE READ', async (transact) => {
      const filesPromises = files.map(async (fileToSave) => {
        const {
          mimetype,
          originalname: name,
          path,
          media: info,
          size: filesize,
          buffer,
          hash,
        } = fileToSave;

        const [mime] = mimetype.split('/');
        const extension = pathParse(name).ext.slice(1);
        const type =
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

        let filesBuffer: ReadStream | Buffer;
        let preview: Buffer | undefined;
        if (Buffer.isBuffer(buffer)) {
          filesBuffer = buffer;
        } else {
          filesBuffer = createReadStream(path);
          preview = await FfMpegPreview(type, path).catch((error) => {
            this.logger.error(error);
            return undefined;
          });
        }

        const fileEntity: DeepPartial<FileEntity> = {
          userId,
          folderId,
          name,
          filesize,
          duration,
          width,
          height,
          info: info as FfprobeData,
          type,
          extension,
          hash,
          preview: preview ? { preview } : undefined,
        };

        const Key = `${folderId}/${hash}-${getS3Name(name)}`;
        const file = await this.s3Service
          .putObject({
            Bucket: this.bucket,
            Key,
            ContentType: mimetype,
            Body: filesBuffer,
          })
          .then((uploaded) => {
            if (fileExist(path)) {
              rimraf(path);
            }
            this.logger.warn(
              `S3: the file "${name}" uploaded to "${Key}": ${JSON.stringify(uploaded)}`,
            );
          })
          .then(() =>
            transact.save(FileEntity, transact.create(FileEntity, fileEntity)),
          )
          .then(({ id }) =>
            this.findOne({ caseInsensitive: false, transact, where: { id } }),
          )
          .catch((error: any) => {
            this.logger.error(
              `S3 upload error: "${JSON.stringify(error)}"`,
              error,
            );
            throw new Error(error?.message || error);
          });

        return file;
      });

      const filesCreated = await Promise.allSettled(filesPromises).then(
        (files) =>
          files.reduce((acc, p) => {
            if (p.status === 'fulfilled' && p.value) {
              return acc.concat(p.value);
            }
            return acc;
          }, [] as FileExtView[]),
      );

      await this.wsStatistics.onMetrics({ userId, storageSpace });

      return filesCreated;
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

  async copy({
    userId,
    toFolder,
    files,
    transact,
  }: {
    userId: string;
    toFolder: FolderEntity;
    files: FileEntity[];
    transact?: EntityManager;
  }): Promise<FileExtView[]> {
    const _transact = transact ?? this.entityManager;
    return _transact.transaction('REPEATABLE READ', async (transact) => {
      const filePromises = files.map(async (file) =>
        this.copyS3Object(toFolder, file)
          .then(() =>
            transact.save(
              FileEntity,
              transact.create(FileEntity, {
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
              }),
            ),
          )
          .then(({ id }) =>
            this.findOne({
              caseInsensitive: false,
              transact,
              where: { id },
            }),
          )
          .catch((error: any) => {
            this.logger.error(`S3 copy files error: ${error}`);
            throw new Error(error?.message || error);
          }),
      );

      return Promise.allSettled(filePromises).then((files) =>
        files.reduce((acc, p) => {
          if (p.status === 'fulfilled' && p.value) {
            return acc.concat(p.value);
          }
          return acc;
        }, [] as FileExtView[]),
      );
    });
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
      file: editor.videoLayers?.map((layer) => layer.file).at(0),
    }));
    errorMsg.audio = audioFiles.map((editor) => ({
      id: editor.id,
      name: editor.name,
      file: editor.audioLayers?.map((layer) => layer.file).at(0),
    }));
    errorMsg.playlist = playlistFiles.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      file: playlist.files.find((file) => filesId.includes(file.id)),
    }));
    throw new ConflictError<I18nPath>('error.CONFLICT_ERROR', {}, errorMsg);
  }

  /**
   * Delete files
   * @async
   * @param {string} filesId Files ID
   * @return {DeleteResult} {DeleteResult}
   */
  async delete(filesId: string[]): Promise<DeleteResult[]> {
    const files = await this.fileRepository.find({
      where: { id: In(filesId) },
      relations: { folder: true },
    });
    if (files.length === 0) {
      return [{ affected: 0, raw: 0 }];
    }

    await this.wsStatistics.onChangeFilesDelete({ filesDelete: files });

    const filesS3DeletePromise = files.map(async (file) =>
      this.deleteS3Object(file)
        .then(() =>
          this.fileRepository.delete({
            id: file.id,
          }),
        )
        .catch((error: any) => {
          this.logger.error(`S3 Error deleteObject: ${JSON.stringify(error)}`);
          throw new Error(error?.message || error);
        }),
    );
    const filesDelete = await Promise.allSettled(filesS3DeletePromise).then(
      (files) =>
        files.reduce((acc, p) => {
          if (p.status === 'fulfilled' && p.value) {
            return acc.concat(p.value);
          }
          return acc;
        }, [] as DeleteResult[]),
    );

    return filesDelete;
  }

  /**
   * Скачивает предпросмотр файла
   *
   * @param {FileEntity} file FileEntity with PreviewEntity
   * @returns Buffer preview
   */
  async downloadPreviewFile(
    res: ExpressResponse,
    file: FileEntity,
  ): Promise<void> {
    await fs.mkdir(this.downloadDir, { recursive: true });
    const filename = pathJoin(this.downloadDir, file.name);
    const filenameParsed = pathParse(filename);
    let { ext } = filenameParsed;

    let type: string;
    switch (file.type) {
      case FileType.VIDEO:
        type = 'video/webm';
        break;
      case FileType.IMAGE:
        type = 'image/jpeg';
        break;
      default:
        type = 'image/svg+xml';
    }

    res.set({
      'Content-Type': type,
      'Cache-Control': 'private, max-age=315360',
    });

    switch (file.type) {
      case FileType.VIDEO: {
        ext = '.webm';
        break;
      }

      case FileType.IMAGE: {
        ext = '.jpg';
        break;
      }

      case FileType.AUDIO: {
        res.set({ 'Content-Length': this.filePreviewAudioLength });
        Readable.from(this.filePreviewAudio).pipe(res);
        return;
      }

      default: {
        switch (ext) {
          case '.xlsx':
          case '.xls':
          case '.ods': {
            res.set({ 'Content-Length': this.filePreviewXlsxLength });
            Readable.from(this.filePreviewXlsx).pipe(res);
            return;
          }

          case '.docx':
          case '.doc':
          case '.odt': {
            res.set({ 'Content-Length': this.filePreviewDocxLength });
            Readable.from(this.filePreviewDocx).pipe(res);
            return;
          }

          case '.pdf': {
            res.set({ 'Content-Length': this.filePreviewPDFLength });
            Readable.from(this.filePreviewPDF).pipe(res);
            return;
          }

          default: {
            res.set({ 'Content-Length': this.filePreviewOtherLength });
            Readable.from(this.filePreviewOther).pipe(res);
            return;
          }
        }
      }
    }

    let preview: Buffer;
    if (file.preview) {
      preview = Buffer.from(file.preview.preview);
    } else {
      try {
        const { size } = await fs.stat(file.name).catch(() => ({
          size: -1,
        }));
        if (file.filesize !== size) {
          const data: GetObjectCommandOutput = await this.getS3Object(file);
          if (data.Body instanceof Readable) {
            this.logger.debug(
              `Preview: the file "${file.name}" has been downloaded`,
            );
            await StreamPromises.pipeline(
              data.Body,
              createWriteStream(filename),
            );
          } else {
            throw new NotFoundError('S3 error');
          }
        }

        preview = await FfMpegPreview(file.type, filename).catch((error) => {
          throw new NotFoundError(error);
        });
        await this.filePreviewRepository.upsert(
          {
            fileId: file.id,
            preview,
          },
          ['fileId'],
        );
      } catch (error: any) {
        this.logger.error(
          `S3 Error preview: "${file.name}" (${getS3FullName(file)}): ${error?.message}`,
          error,
        );

        res.set({ 'Content-Length': this.filePreviewOtherLength });
        Readable.from(this.filePreviewOther).pipe(res);
        return;
      }
    }

    res.set({ 'Content-Length': preview.length });
    Readable.from(preview).pipe(res);
  }
}
