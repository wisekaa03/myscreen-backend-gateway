import { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { In } from 'typeorm';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  PlaylistsGetRequest,
  PlaylistsGetResponse,
  PlaylistGetResponse,
  PlaylistCreateRequest,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { PlaylistService } from '@/database/playlist.service';
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
@ApiTags('playlist')
@Controller('playlist')
export class PlaylistController {
  logger = new Logger(PlaylistController.name);

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly fileService: FileService,
  ) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'playlists_get',
    summary: 'Получение списка плэйлистов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistsGetResponse,
  })
  async getPlaylists(
    @Req() { user }: ExpressRequest,
    @Body() { where, scope }: PlaylistsGetRequest,
  ): Promise<PlaylistsGetResponse> {
    const [data, count] = await this.playlistService.find({
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
    operationId: 'playlists_create',
    summary: 'Создание плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  async createPlaylists(
    @Req() { user }: ExpressRequest,
    @Body() body: PlaylistCreateRequest,
  ): Promise<PlaylistGetResponse> {
    const [files] = await this.fileService.find({
      where: { id: In(body.files), user },
    });
    if (!files) {
      throw new NotFoundError('File specified does not exist');
    }

    const data = await this.playlistService
      .update(user, {
        ...body,
        files,
      })
      .catch((error) => {
        throw new BadRequestException(error);
      });

    return {
      status: Status.Success,
      data,
    };
  }
}
