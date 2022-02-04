import { Readable } from 'node:stream';
import path from 'node:path';
import { createWriteStream, promises as fs } from 'node:fs';
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
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { FfMpegPreview } from '@/shared/ffmpeg';
import { FileService } from '@/database/file.service';
import { VideoType } from '@/enums';

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
  description: 'Ошибка медиа',
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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiExtraModels(FileUploadRequest)
@ApiTags('file')
@Controller('file')
export class FileController {
  logger = new Logger(FileController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
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
    operationId: 'files-upload',
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
  @HttpCode(200)
  @ApiOperation({
    operationId: 'file-get-s3',
    summary: 'Скачивание медиа',
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const file = await this.fileService.findOne(
      {
        where: { userId, id },
      },
      false,
    );
    if (!file) {
      throw new NotFoundException(`File '${id}' is not exists`);
    }

    const getFileS3 = this.fileService.getS3Object(file);
    getFileS3
      .on('httpHeaders', (statusCode, headers, awsResponse) => {
        if (statusCode === 200) {
          res.setHeader('Content-Length', headers['content-length']);
          res.setHeader('Content-Type', headers['content-type']);
          res.setHeader('Last-Modified', headers['last-modified']);
          res.setHeader(
            'Content-Disposition',
            `attachment;filename=${encodeURIComponent(file.name)}`,
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
        this.logger.debug(`The file ${file.name} has been downloaded`);
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
    operationId: 'file-get-preview',
    summary: 'Получить файл превью',
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
  async getFilePreview(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const file = await this.fileService.findOne(
      {
        where: {
          userId,
          id,
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
      },
      ['preview', 'folder'],
    );
    if (!file) {
      throw new NotFoundException('File not found');
    }

    try {
      let buffer = file.preview?.preview;
      if (!buffer) {
        const downloadDir = path.resolve(
          this.configService.get<string>('FILES_UPLOAD', 'upload'),
          file.folder.id,
        );
        await fs.mkdir(downloadDir, { recursive: true });
        const filename = path.resolve(downloadDir, file.name);
        const filenameStream = createWriteStream(filename);
        let outPath = path.resolve(downloadDir, `${file.name}-preview`);

        if (file.videoType === VideoType.Video) {
          res.setHeader('Content-Type', 'video/mp4');
          outPath += '.mp4';
        } else if (file.videoType === VideoType.Image) {
          res.setHeader('Content-Type', 'image/jpeg');
          outPath += '.jpg';
        } else {
          res.setHeader('Content-Type', 'application/octet-stream');
        }

        const getFileS3 = this.fileService.getS3Object(file);
        await getFileS3
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

        const { stderr } = await FfMpegPreview(
          file.videoType,
          file.meta.info!,
          filename,
          outPath,
        );
        if (stderr) {
          throw new BadRequestException();
        }

        buffer = await fs.readFile(outPath);
        Promise.all([
          this.fileService.update(file, {
            duration: file.meta.duration,
            width: file.meta.width,
            height: file.meta.height,
          }),
          this.fileService.updatePreview({
            file,
            preview: Buffer.from(`\\x${buffer.toString('hex')}`),
          }),
        ]);
      }

      res.setHeader('Content-Length', buffer.length);
      res.setHeader(
        'Content-Disposition',
        `attachment;filename=${encodeURIComponent(`preview-${file.name}`)};`,
      );
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

    const data = await this.fileService.update(file, { ...file, ...update });
    if (!data) {
      throw new BadRequestException('File exists and not exists ?');
    }

    return {
      status: Status.Success,
      data,
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
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const file = await this.fileService.findOne({
      where: { userId, id },
    });
    if (!file) {
      throw new NotFoundException(`Media '${id}' is not exists`);
    }

    const { affected } = await this.fileService.delete(file);
    if (!affected) {
      throw new NotFoundException('This file is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
