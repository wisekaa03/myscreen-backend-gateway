import { Request as ExpressRequest } from 'express';
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
  PlaylistUpdateRequest,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { PlaylistService } from '@/database/playlist.service';
import type { FileEntity } from '@/database/file.entity';
import { FileService } from '@/database/file.service';
import { UserRoleEnum } from '@/enums';

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
@Roles(
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
)
@UseGuards(JwtAuthGuard, RolesGuard)
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
    operationId: 'playlists-get',
    summary: 'Получение списка плэйлистов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistsGetResponse,
  })
  async getPlaylists(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { where, scope }: PlaylistsGetRequest,
  ): Promise<PlaylistsGetResponse> {
    const [data, count] = await this.playlistService.findAndCount({
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
    operationId: 'create',
    summary: 'Создание плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  async createPlaylists(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() body: PlaylistCreateRequest,
  ): Promise<PlaylistGetResponse> {
    if (!(Array.isArray(body.files) && body.files.length > 0)) {
      throw new BadRequestException('There should be Files');
    }
    const [files] = await this.fileService.find({
      where: { id: In(body.files), userId },
    });
    if (!Array.isArray(files) || body.files.length !== files.length) {
      throw new NotFoundException('Files specified does not exist');
    }

    const data = await this.playlistService
      .update(userId, {
        ...body,
        files,
      })
      .catch((error) => {
        throw new BadRequestException(`Playlist create error: ${error}`);
      });

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:playlistId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'get',
    summary: 'Получение плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  async getPlaylist(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<PlaylistGetResponse> {
    const data = await this.playlistService.findOne({
      where: { userId, id },
    });
    if (!data) {
      throw new NotFoundException(`Playlist '${id}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch('/:playlistId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'update',
    summary: 'Обновление плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  async updatePlaylists(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
    @Body() body: PlaylistUpdateRequest,
  ): Promise<PlaylistGetResponse> {
    let files: FileEntity[] | undefined;
    if (Array.isArray(body.files) && body.files.length > 0) {
      files = await this.fileService.find({
        where: { id: In(body.files), userId },
      });
      if (!Array.isArray(files) || body.files.length !== files.length) {
        throw new NotFoundException('Files specified does not exist');
      }
    }

    const data = await this.playlistService
      .update(userId, {
        id,
        ...body,
        files,
      })
      .catch((error) => {
        throw new BadRequestException(`Playlist create error: ${error}`);
      });

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete('/:playlistId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'delete',
    summary: 'Удаление плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deletePlaylist(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const data = await this.playlistService.findOne({
      where: { userId, id },
    });
    if (!data) {
      throw new NotFoundException(`Playlist '${id}' not found`);
    }

    const { affected } = await this.playlistService.delete(userId, data);
    if (!affected) {
      throw new NotFoundException('This playlist is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
