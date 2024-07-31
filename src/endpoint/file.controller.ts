import { Readable } from 'node:stream';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { FindOptionsWhere, In, Not } from 'typeorm';
import {
  Body,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { isUUID } from 'class-validator';

import { BadRequestError, NotFoundError } from '@/errors';
import {
  SuccessResponse,
  FilesGetRequest,
  FilesGetResponse,
  FilesUploadResponse,
  FileGetResponse,
  FileUpdateRequest,
  FilesDeleteRequest,
  FilesUpdateRequest,
  FilesCopyRequest,
} from '@/dto';
import { UserRoleEnum, Status, CRUD } from '@/enums';
import { ApiComplexDecorators, Crud, Roles } from '@/decorators';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { paginationQuery } from '@/utils/pagination-query';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FileService } from '@/database/file.service';
import { FileEntity } from '@/database/file.entity';
import { FolderService } from '@/database/folder.service';
import { UserService } from '@/database/user.service';
import { FileExtView } from '@/database/file-ext.view';
import { I18nPath } from '@/i18n';

@ApiComplexDecorators({
  path: ['file'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ],
})
export class FileController {
  logger = new Logger(FileController.name);

  constructor(
    private readonly fileService: FileService,
    private readonly folderService: FolderService,
    private readonly userService: UserService,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'files-get',
    summary: 'Получение списка файлов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FilesGetResponse,
  })
  @Crud(CRUD.READ)
  async getFiles(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: FilesGetRequest,
  ): Promise<FilesGetResponse> {
    let count = 0;
    let data: FileExtView[] = [];
    if (where?.folderId && !isUUID(where?.folderId)) {
      throw new BadRequestError('folderId: must be UUID');
    }
    [data, count] = await this.fileService.findAndCount({
      ...paginationQuery(scope),
      loadEagerRelations: false,
      relations: {},
      select,
      where: {
        ...TypeOrmFind.where(FileEntity, where),
        userId: user.id,
      },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Put()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'file-upload',
    summary: 'Загрузка файлов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FilesUploadResponse,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          description: 'Файл(ы)',
          items: { type: 'string', format: 'binary' },
        },
        folderId: {
          type: 'string',
          format: 'uuid',
          description: 'Папка куда загружать',
          nullable: true,
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  @Crud(CRUD.CREATE)
  async uploadFiles(
    @Req() { user: { id: userId, storageSpace } }: ExpressRequest,
    @Body() { folderId }: { folderId: string },
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<FilesUploadResponse> {
    if (files.length < 1) {
      throw new BadRequestError('Files expected');
    }

    const data = await this.fileService.upload({
      userId,
      storageSpace,
      files,
      folderId,
    });

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Patch()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'files-update',
    summary: 'Изменить файлы',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FileGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async updateFilesDB(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { files }: FilesUpdateRequest,
  ): Promise<FilesGetResponse> {
    const filesPromise = files.map(async (file) => {
      const fileDB = await this.fileService.findOne({
        where: {
          userId,
          id: file.id,
        },
      });

      if (!fileDB) {
        throw new NotFoundError(`Files '${file.id}' is not exists`);
      }

      return this.fileService.update(fileDB, {
        ...fileDB,
        folder: undefined,
        ...file,
      });
    });

    const data = await Promise.all(filesPromise);

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Patch('copy')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'files-copy',
    summary: 'Скопировать файлы',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FileGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async copyFiles(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { toFolder, files }: FilesCopyRequest,
  ): Promise<FilesGetResponse> {
    const filesIds = files.map((file) => file.id);
    const filesCopy = await this.fileService.find({
      where: { userId, id: In(filesIds) },
    });
    if (filesCopy.length !== files.length) {
      const filesNotExist = await this.fileService.find({
        where: { userId, id: Not(In(filesIds)) },
      });
      throw new NotFoundError<I18nPath>('error.file.not_found', {
        args: { id: filesNotExist.join(',') },
      });
    }
    const folder = await this.folderService.findOne({
      where: { userId, id: toFolder },
    });
    if (!folder) {
      throw new NotFoundError<I18nPath>('error.folder.not_found', {
        args: { id: toFolder },
      });
    }

    const data = await this.fileService.copy(userId, folder, filesCopy);

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Get('preview/:fileId')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Accountant,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  ])
  @HttpCode(200)
  @ApiOperation({
    operationId: 'file-download-preview',
    summary: 'Получить файл превью',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    content: {
      'video/webm': {
        encoding: {
          video_webm: {
            contentType: 'video/webm',
          },
        },
      },
      'image/jpeg': {
        encoding: {
          image_jpeg: {
            contentType: 'image/jpeg',
          },
        },
      },
    },
  })
  @Crud(CRUD.READ)
  async downloadPreviewFile(
    @Res() res: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const where: FindOptionsWhere<FileEntity> = { id };
    const file = await this.fileService.findOne({
      where,
      select: [
        'id',
        'userId',
        'hash',
        'info',
        'type',
        'name',
        'duration',
        'width',
        'height',
        'folderId',
        'preview',
        'folder',
      ],
      relations: { preview: true, folder: true },
    });
    if (!file) {
      throw new NotFoundError<I18nPath>('error.file.not_exist', {
        args: { id },
      });
    }

    await this.fileService.downloadPreviewFile(res, file);
  }

  @Get('download/:fileId')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Accountant,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(200)
  @ApiOperation({
    operationId: 'file-download',
    summary: 'Скачивание файла',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    content: {
      'video/mp4': {
        encoding: {
          video_mp4: {
            contentType: 'video/mp4',
          },
        },
      },
      'image/jpeg': {
        encoding: {
          image_jpeg: {
            contentType: 'image/jpeg',
          },
        },
      },
      'image/png': {
        encoding: {
          image_png: {
            contentType: 'image/png',
          },
        },
      },
    },
  })
  @Crud(CRUD.READ)
  async downloadFile(
    @Res() res: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const file = await this.fileService.findOne({
      where: { id },
      relations: {
        folder: true,
      },
    });
    if (!file) {
      throw new NotFoundError(`File '${id}' is not exists`);
    }

    try {
      const data = await this.fileService.getS3Object(file);
      if (data.Body instanceof Readable) {
        this.logger.debug(`The file '${file?.name}' has been downloaded`);

        res.set({
          'Content-Type': data.ContentType || 'application/octet-stream',
          'Content-Length': String(file.filesize),
          'Content-Disposition': `attachment;filename=${encodeURIComponent(file?.name || '')}`,
        });
        data.Body.pipe(res);
      } else {
        throw new Error('Body is not Readable');
      }
    } catch (error: unknown) {
      throw new NotFoundError<I18nPath>('error.file.not_exist', {
        args: { id, error },
      });
    }
  }

  @Post(':fileId')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Accountant,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(200)
  @ApiOperation({
    operationId: 'file-get',
    summary: 'Получить файл',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FileGetResponse,
  })
  @Crud(CRUD.READ)
  async getFileDB(
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<FileGetResponse> {
    const where: FindOptionsWhere<FileEntity> = { id };
    const data = await this.fileService.findOne({
      where,
    });
    if (!data) {
      throw new NotFoundError('File not found');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch(':fileId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'file-update',
    summary: 'Изменить файл',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: FileGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async updateFileDB(
    @Req() { user }: ExpressRequest,
    @Param('fileId', ParseUUIDPipe) id: string,
    @Body() update: FileUpdateRequest,
  ): Promise<FileGetResponse> {
    const where: FindOptionsWhere<FileEntity> = { id };
    if (user.role !== UserRoleEnum.Administrator) {
      where.userId = user.id;
    }
    const file = await this.fileService.findOne({
      where,
    });
    if (!file) {
      throw new NotFoundError<I18nPath>('error.file.not_found', {
        args: { id },
      });
    }

    let data: FileExtView;
    if (update.folderId) {
      const folder = await this.folderService.findOne({
        where: { id: update.folderId },
        select: { id: true },
        loadEagerRelations: false,
        relations: {},
        fromView: false,
      });
      if (!folder) {
        throw new NotFoundError<I18nPath>('error.folder.not_found', {
          args: { id: update.folderId },
        });
      }
      data = await this.fileService.update(file, {
        ...file,
        folderId: folder.id,
        ...update,
      });
    } else {
      data = await this.fileService.update(file, { ...file, ...update });
    }

    if (!data) {
      throw new BadRequestError<I18nPath>('error.file.not_found', {
        args: { id },
      });
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'files-delete',
    summary: 'Удаление файла',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  @Crud(CRUD.DELETE)
  async deleteFiles(
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Body() { filesId }: FilesDeleteRequest,
  ): Promise<SuccessResponse> {
    if (role !== UserRoleEnum.Administrator) {
      const files = await this.fileService.find({
        where: { userId, id: In(filesId) },
      });
      if (files.length !== filesId.length) {
        throw new BadRequestError('Not all files in the database exists');
      }
    }
    await this.fileService.deletePrep(filesId);

    const del = await this.fileService.delete(filesId);
    if (!del.some((d) => d.affected)) {
      throw new NotFoundError('This file is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Delete(':fileId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'file-delete',
    summary: 'Удаление файла',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  @Crud(CRUD.DELETE)
  async deleteFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<SuccessResponse> {
    await this.fileService.deletePrep([fileId]);

    const del = await this.fileService.delete([fileId]);
    if (!del.some((d) => d.affected)) {
      throw new NotFoundError('This file is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
