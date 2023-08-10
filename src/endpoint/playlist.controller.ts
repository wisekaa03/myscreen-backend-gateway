import { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindOptionsWhere, In } from 'typeorm';

import {
  PlaylistsGetRequest,
  PlaylistsGetResponse,
  PlaylistGetResponse,
  PlaylistCreateRequest,
  SuccessResponse,
  PlaylistUpdateRequest,
} from '@/dto';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { Status, UserRoleEnum, CRUD } from '@/enums';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { PlaylistService } from '@/database/playlist.service';
import type { FileEntity } from '@/database/file.entity';
import { FileService } from '@/database/file.service';
import { PlaylistEntity } from '@/database/playlist.entity';
import { UserService } from '@/database/user.service';
import { Crud, Roles, Standard } from '@/decorators';

@Standard(
  'playlist',
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
)
export class PlaylistController {
  logger = new Logger(PlaylistController.name);

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
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
  async getPlaylists(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: PlaylistsGetRequest,
  ): Promise<PlaylistsGetResponse> {
    const [data, count] = await this.playlistService.findAndCount({
      ...paginationQueryToConfig(scope),
      select,
      where: TypeOrmFind.Where(
        where,
        user.role === UserRoleEnum.Administrator ? undefined : user,
      ),
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
  async createPlaylists(
    @Req() { user }: ExpressRequest,
    @Body() body: PlaylistCreateRequest,
  ): Promise<PlaylistGetResponse> {
    if (!(Array.isArray(body.files) && body.files.length > 0)) {
      throw new BadRequestException('Files must exist');
    }
    const files = await this.fileService.find({
      where: { id: In(body.files), userId: user.id },
    });
    if (!Array.isArray(files) || body.files.length !== files.length) {
      throw new NotFoundException('Files specified does not exist');
    }

    const data = await this.playlistService
      .update(user.id, {
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

  @Get(':playlistId')
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  )
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
  async getPlaylist(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<PlaylistGetResponse> {
    const data = await this.playlistService.findOne({
      where: { userId: user.id, id },
    });
    if (!data) {
      throw new NotFoundException(`Playlist '${id}' not found`);
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
  async updatePlaylists(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
    @Body() body: PlaylistUpdateRequest,
  ): Promise<PlaylistGetResponse> {
    let files: FileEntity[] | undefined;
    if (Array.isArray(body.files) && body.files.length > 0) {
      files = await this.fileService.find({
        where: { id: In(body.files), userId: user.id },
      });
      if (!Array.isArray(files) || body.files.length !== files.length) {
        throw new NotFoundException('Files specified does not exist');
      }
    }

    const data = await this.playlistService
      .update(user.id, {
        id,
        ...body,
        files,
      })
      .catch((error) => {
        throw new BadRequestException(`Playlist create error: ${error}`);
      });

    // TODO: ws fix

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
      throw new NotFoundException(`Playlist '${id}' not found`);
    }

    const { affected } = await this.playlistService.delete(data, user);
    if (!affected) {
      throw new NotFoundException('This playlist is not exists');
    }

    // TODO: ws fix

    return {
      status: Status.Success,
    };
  }
}
