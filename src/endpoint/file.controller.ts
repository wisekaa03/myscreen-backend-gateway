import internal from 'node:stream';
import { parse as pathParse } from 'node:path';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { FindOptionsWhere, In } from 'typeorm';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
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
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError,
  ServiceUnavailableError,
  NotFoundError,
  SuccessResponse,
  FilesGetRequest,
  FilesGetResponse,
  FilesUploadResponse,
  FileGetResponse,
  FileUploadRequest,
  FileUploadRequestBody,
  FileUpdateRequest,
  ConflictError,
  FilesDeleteRequest,
  FilesUpdateRequest,
  FilesCopyRequest,
} from '@/dto';
import { UserRoleEnum, VideoType, Status } from '@/enums';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FileService } from '@/database/file.service';
import { FileEntity } from '@/database/file.entity';
import {
  FolderService,
  administratorFolderId,
} from '@/database/folder.service';
import { UserService } from '@/database/user.service';

@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Ответ будет таким если с данным что-то не так',
  type: BadRequestError,
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Ответ для незарегистрированного пользователя',
  type: UnauthorizedError,
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Ответ для неавторизованного пользователя',
  type: ForbiddenError,
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: 'Не найдено',
  type: NotFoundError,
})
@ApiResponse({
  status: HttpStatus.CONFLICT,
  description: 'Ответ для конфликта файлов',
  type: ConflictError,
})
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@ApiResponse({
  status: HttpStatus.SERVICE_UNAVAILABLE,
  description: 'Не доступен сервис',
  type: ServiceUnavailableError,
})
@Roles(
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiExtraModels(FileUploadRequest)
@ApiTags('file')
@Controller('file')
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
  async getFiles(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: FilesGetRequest,
  ): Promise<FilesGetResponse> {
    let count: number = 0;
    let data: Array<FileEntity> = [];
    const folderId = where?.folderId?.toString();
    if (
      user.role === UserRoleEnum.Administrator &&
      folderId?.startsWith(administratorFolderId)
    ) {
      // мы в режиме администратора
      const fromRegex = folderId.match(
        /^([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})\/([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})$/,
      );
      if (fromRegex?.length === 3) {
        // получили имя папки
        const userExpressionId = fromRegex[2];
        const userExpression = await this.userService.findById(
          userExpressionId,
        );
        if (!userExpression) {
          throw new NotFoundException();
        }
        [data, count] = await this.fileService.findAndCount({
          ...paginationQueryToConfig(scope),
          relations: [],
          select,
          where: TypeOrmFind.Where(
            { ...where, folderId: undefined },
            userExpression,
          ),
        });
      }
    } else {
      [data, count] = await this.fileService.findAndCount({
        ...paginationQueryToConfig(scope),
        relations: [],
        select,
        where: TypeOrmFind.Where(
          where,
          user.role === UserRoleEnum.Administrator ? undefined : user,
        ),
      });
    }

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
      required: ['files', 'param'],
      properties: {
        files: {
          type: 'array',
          description: 'Файл(ы)',
          items: { type: 'string', format: 'binary' },
        },
        param: {
          type: 'object',
          description: 'Параметры загрузки файла',
          $ref: getSchemaPath(FileUploadRequest),
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Req() { user }: ExpressRequest,
    @Body() body: FileUploadRequestBody,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<FilesUploadResponse> {
    if (files.length < 1) {
      throw new BadRequestException('Files expected');
    }

    let param: FileUploadRequest;
    try {
      param = JSON.parse(body.param);
    } catch (err) {
      throw new BadRequestException('The param must be a string');
    }
    const data = await this.fileService.upload(user, param, files);

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
        throw new NotFoundException(`Files '${file.id}' is not exists`);
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

  @Patch('/copy')
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
  async copyFiles(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { toFolder, files }: FilesCopyRequest,
  ): Promise<FilesGetResponse> {
    const filesIds = files.map((file) => file.id);
    const filesCopy = await this.fileService.find({
      where: { userId, id: In(filesIds) },
    });
    if (filesCopy.length !== files.length) {
      throw new BadRequestError();
    }
    const folder = await this.folderService.findOne({
      where: { userId, id: toFolder },
    });
    if (!folder) {
      throw new NotFoundException(`Folder '${toFolder}' is not exist`);
    }

    const data = await this.fileService.copy(userId, folder, filesCopy);

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Get('/:fileId')
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  )
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
  async getFileS3(
    /* @Req() { user: { id: userId, role } }: ExpressRequest, */
    @Res() res: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const file = await this.fileService.findOne({
      // TODO: where: {id, userId} - посмотреть если в заявках (application) участвует
      // TODO: то выдавать его, нужно продумать
      where: { id },
      relations: {
        folder: true,
      },
    });
    if (!file) {
      throw new NotFoundException(`File '${id}' is not exists`);
    }

    const data = await this.fileService
      .getS3Object(file)
      .catch((error: unknown) => {
        throw new NotFoundException(`File '${id}' is not exists`);
      });
    if (data.Body instanceof internal.Readable) {
      res.setHeader(
        'Content-Length',
        String(file?.filesize) || String(file?.meta.filesize),
      );
      res.setHeader('Cache-Control', 'private, max-age=31536000');
      // res.setHeader('Content-Type', headers['content-type']);
      // res.setHeader('Last-Modified', headers['last-modified']);
      res.setHeader(
        'Content-Disposition',
        `attachment;filename=${encodeURIComponent(file?.name || '')}`,
      );
      if (!res.headersSent) {
        res.flushHeaders();
      }

      this.logger.debug(`The file '${file?.name}' has been downloaded`);

      data.Body.pipe(res);
    }
  }

  @Post('/:fileId')
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  )
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
  async getFileDB(
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<FileGetResponse> {
    const where: FindOptionsWhere<FileEntity> = { id };
    const data = await this.fileService.findOne({
      where,
    });
    if (!data) {
      throw new NotFoundException('File not found');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:fileId/preview')
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
  async getFilePreview(
    @Res() res: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<void> {
    const where: FindOptionsWhere<FileEntity> = { id: fileId };
    const file = await this.fileService.findOne({
      where,
      select: [
        'id',
        'userId',
        'hash',
        'meta',
        'videoType',
        'name',
        'duration',
        'width',
        'height',
        'folderId',
      ],
      relations: ['preview', 'folder'],
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    try {
      let buffer = file.preview?.preview;
      if (!buffer || buffer.length === 0) {
        buffer = await this.fileService.previewFile(file).catch((reason) => {
          throw reason;
        });
      }

      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'private, max-age=315360');
      const fileParse = pathParse(file.name);
      if (file.videoType === VideoType.Video) {
        res.setHeader('Content-Type', 'video/webm');
        res.setHeader(
          'Content-Disposition',
          `attachment;filename=${encodeURIComponent(
            `${fileParse.name}-preview.webm`,
          )};`,
        );
      } else if (file.videoType === VideoType.Image) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader(
          'Content-Disposition',
          `attachment;filename=${encodeURIComponent(
            `${fileParse.name}-preview.jpeg`,
          )};`,
        );
      } else {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader(
          'Content-Disposition',
          `attachment;filename=${encodeURIComponent(
            `${fileParse.name}-preview${fileParse.ext}`,
          )};`,
        );
      }
      res.write(buffer);
      res.end();
    } catch (error: unknown) {
      throw new NotFoundException(error);
    }
  }

  @Patch('/:fileId')
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
  async updateFileDB(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('fileId', ParseUUIDPipe) id: string,
    @Body() update: FileUpdateRequest,
  ): Promise<FileGetResponse> {
    const file = await this.fileService.findOne({
      where: {
        userId,
        id,
      },
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    let data: FileEntity;
    if (update.folderId) {
      const folder = await this.folderService.findOne({
        where: { id: update.folderId },
      });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
      data = await this.fileService.update(
        file,
        Object.assign(file, folder, update),
      );
    } else {
      data = await this.fileService.update(file, Object.assign(file, update));
    }

    if (!data) {
      throw new BadRequestException('File exists and not exists ?');
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
  async deleteFiles(
    @Req() { user }: ExpressRequest,
    @Body() { filesId }: FilesDeleteRequest,
  ): Promise<SuccessResponse> {
    await this.fileService.deletePrep(filesId);

    const { affected } = await this.fileService.delete(user, filesId);
    if (!affected) {
      throw new NotFoundException('This file is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Delete('/:fileId')
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
  async deleteFile(
    @Req() { user }: ExpressRequest,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<SuccessResponse> {
    await this.fileService.deletePrep([fileId]);

    const { affected } = await this.fileService.delete(user, [fileId]);
    if (!affected) {
      throw new NotFoundException('This file is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
