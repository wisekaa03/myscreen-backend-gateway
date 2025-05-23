import { Request as ExpressRequest } from 'express';
import {
  Body,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindOptionsWhere, In } from 'typeorm';

import { BadRequestError, NotFoundError } from '@/errors';
import {
  PlaylistsGetRequest,
  PlaylistsGetResponse,
  PlaylistGetResponse,
  PlaylistCreateRequest,
  SuccessResponse,
  PlaylistUpdateRequest,
} from '@/dto';
import { ApiComplexDecorators, Crud, Roles } from '@/decorators';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { Status, UserRoleEnum, CRUD } from '@/enums';
import { paginationQuery } from '@/utils/pagination-query';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { PlaylistService } from '@/database/playlist.service';
import type { FileEntity } from '@/database/file.entity';
import { FileService } from '@/database/file.service';
import { PlaylistEntity } from '@/database/playlist.entity';
import { I18nPath } from '@/i18n';

@ApiComplexDecorators({
  path: ['playlist'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ],
})
export class PlaylistController {
  logger = new Logger(PlaylistController.name);

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly fileService: FileService,
  ) {}

  @Post()
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
  @Crud(CRUD.READ)
  async findMany(
    @Req() { user }: ExpressRequest,
    @Body() { where: origWhere, select, scope }: PlaylistsGetRequest,
  ): Promise<PlaylistsGetResponse> {
    const { id: userId, role } = user;
    const where = TypeOrmFind.where(PlaylistEntity, {
      ...origWhere,
      hide: false,
      userId: role !== UserRoleEnum.Administrator ? userId : undefined,
    });
    const [data, count] = await this.playlistService.findAndCount({
      ...paginationQuery(scope),
      select,
      where,
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Put()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'playlist-create',
    summary: 'Создание плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  @Crud(CRUD.CREATE)
  async createPlaylist(
    @Req() { user }: ExpressRequest,
    @Body() body: PlaylistCreateRequest,
  ): Promise<PlaylistGetResponse> {
    if (!(Array.isArray(body.files) && body.files.length > 0)) {
      throw new BadRequestError('Files must exist');
    }
    const files = await this.fileService.find({
      where: { id: In(body.files), userId: user.id },
      loadEagerRelations: false,
      relations: {},
    });
    if (!(Array.isArray(files) && body.files.length === files.length)) {
      throw new NotFoundError('Specified file(s) does not exist');
    }

    const data = await this.playlistService.create({
      ...body,
      files,
      userId: user.id,
    });

    return {
      status: Status.Success,
      data,
    };
  }

  @Get(':playlistId')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(200)
  @ApiOperation({
    operationId: 'playlist-get',
    summary: 'Получение плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  @Crud(CRUD.READ)
  async findOne(
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<PlaylistGetResponse> {
    const data = await this.playlistService.findOne({
      where: { id },
    });
    if (!data) {
      throw new NotFoundError<I18nPath>('error.playlist.not_found', {
        args: { id },
      });
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch(':playlistId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'playlist-update',
    summary: 'Обновление плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async updatePlaylist(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
    @Body() body: PlaylistUpdateRequest,
  ): Promise<PlaylistGetResponse> {
    const playlist = await this.playlistService.findOne({
      where: { id },
    });
    if (!playlist) {
      throw new NotFoundError<I18nPath>('error.playlist.not_found', {
        args: { id },
      });
    }

    let files: FileEntity[] = [];
    if (Array.isArray(body.files) && body.files.length > 0) {
      files = await this.fileService.find({
        where: { id: In(body.files), userId: user.id },
        loadEagerRelations: false,
        relations: {},
      });
      if (!(Array.isArray(files) && body.files.length === files.length)) {
        throw new NotFoundError('Specified file(s) does not exist');
      }
    }

    const data = await this.playlistService.update(id, { ...body, files });

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete(':playlistId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'playlist-delete',
    summary: 'Удаление плэйлиста',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  @Crud(CRUD.DELETE)
  async deletePlaylist(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const where: FindOptionsWhere<PlaylistEntity> = { id };
    if (user.role !== UserRoleEnum.Administrator) {
      where.userId = user.id;
    }
    const data = await this.playlistService.findOne({ where });
    if (!data) {
      throw new NotFoundError<I18nPath>('error.playlist.not_found', {
        args: { id },
      });
    }

    const { affected } = await this.playlistService.delete(user, data);
    if (!affected) {
      throw new NotFoundError<I18nPath>('error.playlist.not_found', {
        args: { id },
      });
    }

    return {
      status: Status.Success,
    };
  }
}
