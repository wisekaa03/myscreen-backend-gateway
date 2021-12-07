import type { Request as ExpressRequest } from 'express';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  BadRequestError,
  UnauthorizedError,
  MediaGetFilesRequest,
  MediaGetFilesResponse,
  ForbiddenError,
  InternalServerError,
  Status,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
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
  @ApiOperation({
    operationId: 'media',
    summary: 'Получение списка файлов',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: MediaGetFilesResponse,
  })
  async getMedia(
    @Req() { user }: ExpressRequest,
    @Body() body: MediaGetFilesRequest,
  ): Promise<MediaGetFilesResponse> {
    const [data, count] = await this.mediaService.getMediaFiles({
      take: body.scope?.limit ?? undefined,
      skip:
        body.scope?.page && body.scope.page > 0
          ? (body.scope.limit ?? 0) * (body.scope.page - 1)
          : undefined,
      order: body.scope?.order ?? undefined,
      where: {
        user,
        // ...body.where,
      },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }
}
