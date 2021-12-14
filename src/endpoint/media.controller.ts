import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { PromiseResult } from 'aws-sdk/lib/request';
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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectS3, S3 } from 'nestjs-s3';

import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError,
  ServiceUnavailableError,
  Status,
  SuccessResponse,
  MediaGetFilesRequest,
  MediaGetFilesResponse,
  MediaUploadFileRequest,
  MediaUploadFilesResponse,
  NotFoundError,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { MediaService } from '@/database/media.service';

@ApiTags('media')
@ApiResponse({
  status: 400,
  description: 'Ответ будет таким если с регистрационным данным что-то не так',
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
@Controller('/media')
export class MediaController {
  logger = new Logger(MediaController.name);

  constructor(
    private readonly mediaService: MediaService,
    @InjectS3() private readonly s3Service: S3,
  ) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'media_get',
    summary: 'Получение списка медиа',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MediaGetFilesResponse,
  })
  async getMedia(
    @Req() { user }: ExpressRequest,
    @Body() { where, scope }: MediaGetFilesRequest,
  ): Promise<MediaGetFilesResponse> {
    if (!where.folderId) {
      throw new BadRequestException('The folderId must be provided');
    }

    const [data, count] = await this.mediaService.getMediaFiles({
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
    operationId: 'media_upload',
    summary: 'Загрузка медиа',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MediaUploadFilesResponse,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['folderId', 'files'],
      properties: {
        folderId: {
          type: 'string',
          format: 'uuid',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMedia(
    @Req() { user }: ExpressRequest,
    @Body() { folderId }: MediaUploadFileRequest,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<MediaUploadFilesResponse> {
    if (files.some((file) => file.media)) {
      const data = await this.mediaService.upload(user, folderId, files);

      return {
        status: Status.Success,
        data,
      };
    }

    throw new BadRequestError('Some of the files has not a media properties');
  }

  @Get('/file/:mediaId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'media_get_file',
    summary: 'Скачивание медиа',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    content: {
      'video/mp4': {
        encoding: {
          contentType: {
            contentType: 'video/mp4',
          },
        },
      },
    },
  })
  async getMediaFile(
    @Req() { user }: ExpressRequest,
    @Response() response: ExpressResponse,
    @Param('mediaId', ParseUUIDPipe) id: string,
  ): Promise<PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>> {
    return this.mediaService
      .getMediaFileS3(response, user, id)
      .catch((error) => {
        throw new NotFoundException(`S3 Error: ${error}`);
      });
  }

  @Delete('/:mediaId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'media_delete',
    summary: 'Удаление медиа',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteMedia(
    @Req() { user }: ExpressRequest,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ): Promise<SuccessResponse> {
    const success = await this.mediaService.delete(user, mediaId);

    if (success) {
      return {
        status: Status.Success,
      };
    }

    throw new NotFoundException('This file is not exists');
  }
}
