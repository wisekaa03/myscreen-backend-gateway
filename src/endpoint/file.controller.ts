import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import type { PromiseResult } from 'aws-sdk/lib/request';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  Response,
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
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { FileService } from '@/database/file.service';

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
@ApiTags('file')
@Controller('file')
export class FileController {
  logger = new Logger(FileController.name);

  constructor(private readonly fileService: FileService) {}

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
    @Req() { user }: ExpressRequest,
    @Body() { where, scope }: FilesGetRequest,
  ): Promise<FilesGetResponse> {
    const [data, count] = await this.fileService.find({
      ...paginationQueryToConfig(scope),
      where: {
        user,
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
  @ApiExtraModels(FileUploadRequest)
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
    const [data, count] = await this.fileService.upload(user, param, files);

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Get('/:fileId')
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
    @Req() { user }: ExpressRequest,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<FileGetResponse> {
    const data = await this.fileService.findOne({
      where: {
        userId: user.id,
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
    @Req() { user }: ExpressRequest,
    @Param('fileId', ParseUUIDPipe) id: string,
    @Body() update: FileUpdateRequest,
  ): Promise<FileGetResponse> {
    const file = await this.fileService.findOne({
      where: {
        userId: user.id,
        id,
      },
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const data = await this.fileService.update(update);
    if (!data) {
      throw new BadRequestException('File exists and not exists ?');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Post('/:fileId')
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
    },
  })
  async getFileS3(
    @Req() { user }: ExpressRequest,
    @Response() response: ExpressResponse,
    @Param('fileId', ParseUUIDPipe) id: string,
  ): Promise<PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>> {
    return this.fileService.getFileS3(response, user, id).catch((error) => {
      throw new NotFoundException(`S3 Error: ${error}`);
    });
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
    const success = await this.fileService.delete(user, fileId);

    if (success) {
      return {
        status: Status.Success,
      };
    }

    throw new NotFoundException('This file is not exists');
  }
}
