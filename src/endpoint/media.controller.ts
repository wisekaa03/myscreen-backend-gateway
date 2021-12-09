import type { Request as ExpressRequest } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Req,
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';
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
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { MediaService } from '@/database/media.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';

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
    @Body() body: MediaGetFilesRequest,
  ): Promise<MediaGetFilesResponse> {
    const [data, count] = await this.mediaService.getMediaFiles({
      ...paginationQueryToConfig(body.scope),
      where: {
        user,
        ...body.where,
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
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
      }),
    }),
  )
  async uploadMedia(
    @Req() { user }: ExpressRequest,
    @Body() body: MediaUploadFileRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SuccessResponse> {
    this.logger.debug(file);

    return {
      status: Status.Success,
    };
  }
}
