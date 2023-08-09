import { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { FindOptionsWhere, In } from 'typeorm';

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
import { Status, UserRoleEnum, CRUDS, Controllers } from '@/enums';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { PlaylistService } from '@/database/playlist.service';
import type { FileEntity } from '@/database/file.entity';
import { FileService } from '@/database/file.service';
import { PlaylistEntity } from '@/database/playlist.entity';
import { UserService } from '@/database/user.service';

@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Ответ будет таким если с данным что-то не так',
  type: BadRequestError,
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Ответ для незарегистрированного пользователя',
  type: UnauthorizedError,
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Ответ для неавторизованного пользователя',
  type: ForbiddenError,
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: 'Не найдено',
  type: NotFoundError,
})
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
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
    private readonly userService: UserService,
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
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: PlaylistsGetRequest,
  ): Promise<PlaylistsGetResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.PLAYLIST, CRUDS.READ, user);

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
  async createPlaylists(
    @Req() { user }: ExpressRequest,
    @Body() body: PlaylistCreateRequest,
  ): Promise<PlaylistGetResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.PLAYLIST, CRUDS.CREATE, user);

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

  @Get('/:playlistId')
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
  async getPlaylist(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<PlaylistGetResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.PLAYLIST, CRUDS.READ, user);

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

  @Patch('/:playlistId')
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
  async updatePlaylists(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
    @Body() body: PlaylistUpdateRequest,
  ): Promise<PlaylistGetResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.PLAYLIST, CRUDS.UPDATE, user);

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

  @Delete('/:playlistId')
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
  async deletePlaylist(
    @Req() { user }: ExpressRequest,
    @Param('playlistId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.PLAYLIST, CRUDS.DELETE, user);

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
