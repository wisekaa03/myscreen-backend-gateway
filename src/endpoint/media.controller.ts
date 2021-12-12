import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
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

import {
  BadRequestError,
  UnauthorizedError,
  MediaGetFilesRequest,
  MediaGetFilesResponse,
  ForbiddenError,
  InternalServerError,
  Status,
  SuccessResponse,
  MediaUploadFileRequest,
  MediaUploadFilesResponse,
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
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('/media')
export class MediaController {
  logger = new Logger(MediaController.name);

  constructor(private readonly mediaService: MediaService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'media_get',
    summary: 'Получение списка файлов',
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

  @Post('/upload')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'media_upload',
    summary: 'Загрузка файлов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
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
    const data = await this.mediaService.upload(user, folderId, files);

    return {
      status: Status.Success,
      data,
    };
  }
}
