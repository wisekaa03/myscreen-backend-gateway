import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  HttpCode,
  Inject,
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

import { FindManyOptions } from 'typeorm';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  MonitorGetResponse,
  MonitorRequest,
  MonitorPartialRequest,
  MonitorsGetRequest,
  MonitorsGetResponse,
  MonitorsPlaylistAttachRequest,
  NotFoundError,
  PlaylistGetResponse,
  ServiceUnavailableError,
  SuccessResponse,
  UnauthorizedError,
  MonitorCreateRequest,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status, UserRoleEnum } from '@/enums';
import { MonitorService } from '@/database/monitor.service';
import { WSGateway } from '@/websocket/ws.gateway';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { PlaylistService } from '@/database/playlist.service';
import { MonitorEntity } from '@/database/monitor.entity';

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
  description: 'Монитор не найден',
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
@ApiTags('monitor')
@Controller('monitor')
export class MonitorController {
  logger = new Logger(MonitorController.name);

  constructor(
    private readonly monitorService: MonitorService,
    private readonly playlistService: PlaylistService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Post('/')
  @HttpCode(200)
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    operationId: 'monitors-get',
    summary: 'Получение списка мониторов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorsGetResponse,
  })
  async getMonitors(
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Body() { where, scope }: MonitorsGetRequest,
  ): Promise<MonitorsGetResponse> {
    const conditional: FindManyOptions<MonitorEntity> = {
      ...paginationQueryToConfig(scope),
      where,
    };
    if (role.includes(UserRoleEnum.Monitor)) {
      // добавляем то, что содержится у нас в userId: monitorId.
      conditional.where = { id: userId };
    } else {
      conditional.where = { userId };
    }
    const [data, count] = await this.monitorService.findAndCount(conditional);

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Put('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-create',
    summary: 'Создание монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorGetResponse,
  })
  async createMonitors(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() monitor: MonitorCreateRequest,
  ): Promise<MonitorGetResponse> {
    const monitorEntity = await this.monitorService.findOne({
      where: { code: monitor.code },
    });
    if (monitorEntity) {
      throw new BadRequestException(
        `Монитор '${monitorEntity.name}'/'${monitorEntity.code}' уже существует`,
      );
    }

    const data = await this.monitorService.update(userId, monitor).catch(() => {
      throw new BadRequestException(`Монитор '${monitor.name}' уже существует`);
    });

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch('/playlist')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-playlist-create',
    summary: 'Создание связки плэйлиста и монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorsGetResponse,
  })
  async createMonitorPlaylist(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() attach: MonitorsPlaylistAttachRequest,
  ): Promise<MonitorsGetResponse> {
    if (!Array.isArray(attach.monitors) || attach.monitors.length < 1) {
      throw new BadRequestException('Monitors should not be null or undefined');
    }
    const playlist = await this.playlistService.findOne({
      where: {
        userId,
        id: attach.playlistId,
      },
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist '${attach.playlistId}' not found`);
    }

    const dataPromise = attach.monitors.map(async (monitorId) => {
      const monitor = await this.monitorService
        .findOne({
          where: {
            userId,
            id: monitorId,
          },
        })
        .then((monitorFound) => {
          if (!monitorFound) {
            throw new NotFoundException(`Monitor '${monitorId}' not found`);
          }
          return this.monitorService.update(userId, {
            ...monitorFound,
            playlist,
          });
        });

      /* await */ this.wsGateway.monitorPlaylist(monitor, playlist);

      return monitor;
    });

    const data = await Promise.all(dataPromise);

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Delete('/playlist')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-playlist-delete',
    summary: 'Удаление связки плэйлиста и монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorsGetResponse,
  })
  async deleteMonitorPlaylist(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() attach: MonitorsPlaylistAttachRequest,
  ): Promise<MonitorsGetResponse> {
    if (attach.monitors.length === 0) {
      throw new BadRequestException();
    }
    const playlist = await this.playlistService.findOne({
      where: {
        userId,
        id: attach.playlistId,
      },
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist '${attach.playlistId}' not found`);
    }

    const dataPromise = attach.monitors.map(async (monitorId) => {
      const monitor = await this.monitorService.findOne({
        where: {
          userId,
          id: monitorId,
        },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }
      if (!monitor.playlist) {
        throw new NotFoundException(
          `Monitor '${monitorId}' is not playing playlist '${playlist.id}'`,
        );
      }
      return this.monitorService.update(userId, {
        ...monitor,
        playlist: null,
      });
    });
    const data = await Promise.all(dataPromise);

    return {
      status: Status.Success,
      count: data?.length,
      data,
    };
  }

  @Get('/:monitorId')
  @HttpCode(200)
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    operationId: 'monitor-get',
    summary: 'Получение монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorGetResponse,
  })
  async getMonitor(
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<MonitorGetResponse> {
    const conditional: FindManyOptions<MonitorEntity> = {};
    if (role.includes(UserRoleEnum.Monitor)) {
      conditional.where = { id: userId };
    } else {
      conditional.where = { userId, id };
    }
    const data = await this.monitorService.findOne(conditional);
    if (!data) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:monitorId/playlist')
  @HttpCode(200)
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    operationId: 'monitor-get-playlist',
    summary: 'Получение плэйлиста монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PlaylistGetResponse,
  })
  async getMonitorPlaylist(
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<PlaylistGetResponse> {
    const conditional: FindManyOptions<MonitorEntity> = {
      relations: ['playlist'],
    };
    if (role.includes(UserRoleEnum.Monitor)) {
      conditional.where = { id: userId };
    } else {
      conditional.where = { userId, id };
    }
    const data = await this.monitorService.findOne(conditional);
    if (!data) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }
    if (!data.playlist) {
      throw new NotFoundException(`Have no playlist in monitor '${id}'`);
    }

    return {
      status: Status.Success,
      data: data.playlist,
    };
  }

  @Patch('/:monitorId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-update',
    summary: 'Изменение монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorGetResponse,
  })
  async updateMonitor(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
    @Body() update: MonitorPartialRequest,
  ): Promise<MonitorGetResponse> {
    const monitor = await this.monitorService.findOne({
      where: {
        userId,
        id,
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor ${id} is not found`);
    }
    const data = await this.monitorService.update(userId, {
      ...update,
      id,
    });

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete('/:monitorId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-delete',
    summary: 'Удаление монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteMonitor(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const monitor = await this.monitorService.findOne({
      where: {
        userId,
        id,
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' is not found`);
    }

    const { affected } = await this.monitorService.delete(userId, monitor);
    if (!affected) {
      throw new NotFoundException('This monitor is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
