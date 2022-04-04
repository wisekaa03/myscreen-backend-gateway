import { Readable } from 'node:stream';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
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
import { ConfigService } from '@nestjs/config';
import type { FindOptionsWhere } from 'typeorm';

import path from 'node:path';
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
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { FileService } from '@/database/file.service';
import { UserRoleEnum, VideoType } from '@/enums';
import { FileEntity } from '@/database/file.entity';
import { MonitorService } from '@/database/monitor.service';

@ApiResponse({
  status: 400,
  description: 'Ответ будет таким если с данным что-то не так',
  type: BadRequestError,
})
@ApiResponse({
  status: 401,
  description: 'Ответ для незарегистрированного пользователя',
  type: UnauthorizedError,
})
@ApiResponse({
  status: 403,
  description: 'Ответ для неавторизованного пользователя',
  type: ForbiddenError,
})
@ApiResponse({
  status: 404,
  description: 'Ошибка файлов',
  type: NotFoundError,
})
@ApiResponse({
  status: 409,
  description: 'Ответ для конфликта файлов',
  type: ConflictError,
})
@ApiResponse({
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@ApiResponse({
  status: 503,
  description: 'Ошибка сервера',
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
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
    private readonly monitorService: MonitorService,
  ) {}

  @Post('/')
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { where, scope }: FilesGetRequest,
  ): Promise<FilesGetResponse> {
    const [data, count] = await this.fileService.findAndCount({
      ...paginationQueryToConfig(scope),
      where: {
        userId,
        ...where,
      },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Put('/')
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
    @Req() { user: { id: userId } }: ExpressRequest,
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
    const data = await this.fileService.upload(userId, param, files);

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
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const where: FindOptionsWhere<FileEntity> = {
      id,
    };
    let file: FileEntity | null = null;
    if (role.includes(UserRoleEnum.Monitor)) {
      const monitor = await this.monitorService.findOne({
        where: { id: userId },
      });
      if (monitor && monitor.playlist && monitor.playlist.files) {
        file = monitor.playlist.files.find((f) => f.id === id) ?? null;
      }
    } else {
      where.userId = userId;
      file = await this.fileService.findOne({ where });
    }
    if (!file) {
      throw new NotFoundException(`File '${id}' is not exists`);
    }

    await this.fileService
      .getS3Object(file)
      .on('httpHeaders', (statusCode, headers, awsResponse) => {
        if (statusCode === 200) {
          res.setHeader(
            'Content-Length',
            headers['content-length'] ||
              String(file?.filesize) ||
              String(file?.meta.filesize),
          );
          res.setHeader('Cache-Control', 'private, max-age=31536000');
          res.setHeader('Content-Type', headers['content-type']);
          res.setHeader('Last-Modified', headers['last-modified']);
          res.setHeader(
            'Content-Disposition',
            `attachment;filename=${encodeURIComponent(file?.name || '')}`,
          );
          if (!res.headersSent) {
            res.flushHeaders();
          }
          (awsResponse.httpResponse.createUnbufferedStream() as Readable).pipe(
            res,
          );
        } else {
          throw new HttpException(
            awsResponse.error || awsResponse.httpResponse.statusMessage,
            awsResponse.httpResponse.statusCode,
          );
        }
      })
      .promise()
      .then(() => {
        this.logger.debug(`The file '${file?.name}' has been downloaded`);
      })
      .catch((error: unknown) => {
        this.logger.error(`S3 Error: ${JSON.stringify(error)}`, error);
        if (error instanceof HttpException) {
          res.writeHead(error.getStatus(), error.message || 'Not Found');
        } else {
          res.writeHead(404, 'Not Found');
        }
        res.send();
      });
  }

  @Post('/:fileId')
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<FileGetResponse> {
    const data = await this.fileService.findOne({
      where: {
        userId,
        id,
      },
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<void> {
    const file = await this.fileService.findOne({
      where: {
        userId,
        id: fileId,
      },
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
      if (!buffer) {
        buffer = await this.fileService.previewFile(file).catch((reason) => {
          throw reason;
        });
      } else {
        this.fileService.previewFile(file).catch((reason) => {
          this.logger.error(`previewFile: ${reason}`);
        });
      }

      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'private, max-age=31536000');
      const fileParse = path.parse(file.name);
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

    const data = await this.fileService.update(file, {
      ...file,
      folder: undefined,
      ...update,
    });
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
    operationId: 'file-delete',
    summary: 'Удаление файла',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteFiles(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { filesId }: FilesDeleteRequest,
  ): Promise<SuccessResponse> {
    await this.fileService.deletePrep(filesId);

    const { affected } = await this.fileService.delete(userId, filesId);
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<SuccessResponse> {
    await this.fileService.deletePrep([fileId]);

    const { affected } = await this.fileService.delete(userId, [fileId]);
    if (!affected) {
      throw new NotFoundException('This file is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
