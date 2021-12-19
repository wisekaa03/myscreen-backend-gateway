import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  NotImplementedException,
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

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  MonitorCreateResponse,
  MonitorGetResponse,
  MonitorRequest,
  MonitorsGetRequest,
  MonitorsGetResponse,
  MonitorsPlaylistAttachRequest,
  NotFoundError,
  PlaylistsGetResponse,
  ServiceUnavailableError,
  SuccessResponse,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { MonitorService } from '@/database/monitor.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { PlaylistService } from '@/database/playlist.service';

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
  description: 'Ошибка монитора',
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
@ApiTags('monitor')
@Controller('monitor')
export class MonitorController {
  logger = new Logger(MonitorController.name);

  constructor(
    private readonly monitorService: MonitorService,
    private readonly playlistService: PlaylistService,
  ) {}

  @Post('/')
  @HttpCode(200)
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
    @Req() { user }: ExpressRequest,
    @Body() { where, scope }: MonitorsGetRequest,
  ): Promise<MonitorsGetResponse> {
    const [data, count] = await this.monitorService.find({
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

  @Post('/create')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-create',
    summary: 'Создание монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorCreateResponse,
  })
  async createMonitors(
    @Req() { user }: ExpressRequest,
    @Body() monitor: MonitorRequest,
  ): Promise<MonitorCreateResponse> {
    const data = await this.monitorService.update(user, monitor).catch(() => {
      throw new BadRequestException(`Монитор '${monitor.name}' уже существует`);
    });

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:monitorId')
  @HttpCode(200)
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
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<MonitorGetResponse> {
    const data = await this.monitorService.findOne({
      where: {
        userId: user.id,
        id,
      },
    });
    if (!data) {
      throw new NotFoundException(`Monitor ${id} not found`);
    }

    return {
      status: Status.Success,
      data,
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
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
    @Body() update: MonitorRequest,
  ): Promise<MonitorGetResponse> {
    const monitor = await this.monitorService.findOne({
      where: {
        userId: user.id,
        id,
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor ${id} is not found`);
    }
    const data = await this.monitorService.update(user, {
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
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const monitor = await this.monitorService.findOne({
      where: {
        userId: user.id,
        id,
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' is not found`);
    }
    await this.monitorService.delete(user, monitor);

    return {
      status: Status.Success,
    };
  }

  // @Get('/playlist/:monitorId')
  // @HttpCode(200)
  // @ApiOperation({
  //   operationId: 'monitor-playlist-get',
  //   summary: 'Получение плэйлиста монитора',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Успешный ответ',
  //   type: PlaylistsGetResponse,
  // })
  // async getMonitorPlaylist(
  //   @Req() { user }: ExpressRequest,
  //   @Param('monitorId', ParseUUIDPipe) id: string,
  // ): Promise<PlaylistsGetResponse> {
  //   const monitor = await this.monitorService.findOne({
  //     where: {
  //       userId: user.id,
  //       id,
  //     },
  //   });
  //   if (!monitor) {
  //     throw new NotFoundException(`Monitor '${id}' is not found`);
  //   }
  //   if (!monitor.currentPlaylistId) {
  //     throw new NotFoundException(`Monitor '${id}' has no playlist`);
  //   }

  //   return {
  //     status: Status.Success,
  //     count: monitor.playlists?.length ?? 0,
  //     data: monitor.playlists ?? [],
  //   };
  // }

  @Patch('/playlist')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-playlist-update',
    summary: 'Создание связки плэйлиста и монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorsGetResponse,
  })
  async updateMonitorPlaylist(
    @Req() { user }: ExpressRequest,
    @Body() attach: MonitorsPlaylistAttachRequest,
  ): Promise<MonitorsGetResponse> {
    if (attach.monitors.length === 0) {
      throw new BadRequestException();
    }
    const playlist = await this.playlistService.findOne({
      where: {
        userId: user.id,
        id: attach.playlistId,
      },
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist '${attach.playlistId}' not found`);
    }

    const dataPromise = attach.monitors.map(async (monitorId) => {
      const monitor = await this.monitorService.findOne({
        where: {
          userId: user.id,
          id: monitorId,
        },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }

      return this.monitorService.update(user, {
        ...monitor,
        currentPlaylist: playlist,
      });
    });
    const data = await Promise.all(dataPromise);

    return {
      status: Status.Success,
      count: data?.length,
      data,
    };
  }

  @Delete('/playlist')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-playlist-update',
    summary: 'Удаление связки плэйлиста и монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorsGetResponse,
  })
  async deleteMonitorPlaylist(
    @Req() { user }: ExpressRequest,
    @Body() attach: MonitorsPlaylistAttachRequest,
  ): Promise<MonitorsGetResponse> {
    if (attach.monitors.length === 0) {
      throw new BadRequestException();
    }
    const playlist = await this.playlistService.findOne({
      where: {
        userId: user.id,
        id: attach.playlistId,
      },
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist '${attach.playlistId}' not found`);
    }

    const dataPromise = attach.monitors.map(async (monitorId) => {
      const monitor = await this.monitorService.findOne({
        where: {
          userId: user.id,
          id: monitorId,
        },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }
      if (!monitor.currentPlaylist) {
        throw new NotFoundException(
          `Monitor '${monitorId}' is not playing playlist '${playlist.id}'`,
        );
      }
      return this.monitorService.update(user, {
        ...monitor,
        currentPlaylist: null,
      });
    });
    const data = await Promise.all(dataPromise);

    return {
      status: Status.Success,
      count: data?.length,
      data,
    };
  }
}
