import { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseUUIDPipe,
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
  SuccessResponse,
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
        userId: user.id,
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
      where: { id: In(body.files), userId: user.id },
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

  @Get('/:playlistId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'playlist_get',
    summary: 'Получение плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  async getPlaylist(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<PlaylistGetResponse> {
    const data = await this.playlistService.findOne({
      where: { userId: user.id, id },
    });
    if (!data) {
      throw new NotFoundError(`Playlist '${id}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete('/:playlistId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'playlist_delete',
    summary: 'Удаление плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deletePlaylist(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const data = await this.playlistService.findOne({
      where: { userId: user.id, id },
    });
    if (!data) {
      throw new NotFoundError(`Playlist '${id}' not found`);
    }
    await this.playlistService.delete(user, data);

    return {
      status: Status.Success,
    };
  }
}
