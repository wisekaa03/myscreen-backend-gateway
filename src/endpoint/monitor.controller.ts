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

import { FindConditions, FindManyOptions } from 'typeorm';
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
  ServiceUnavailableError,
  SuccessResponse,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { MonitorService } from '@/database/monitor.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { PlaylistService } from '@/database/playlist.service';
import { UserRoleEnum } from '@/enums';
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
      // добавляем то, что содержится у нас в userId: code.
      (conditional.where as FindConditions<MonitorEntity>).code = userId;
    } else {
      (conditional.where as FindConditions<MonitorEntity>).userId = userId;
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
    operationId: 'create',
    summary: 'Создание монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorCreateResponse,
  })
  async createMonitors(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() monitor: MonitorRequest,
  ): Promise<MonitorCreateResponse> {
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
    operationId: 'playlist-create',
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
      const monitor = await this.monitorService.findOne({
        where: {
          userId,
          id: monitorId,
        },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }

      return this.monitorService.update(userId, {
        ...monitor,
        playlist,
      });
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
    operationId: 'playlist-delete',
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
  @ApiOperation({
    operationId: 'get',
    summary: 'Получение монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorGetResponse,
  })
  async getMonitor(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<MonitorGetResponse> {
    const data = await this.monitorService.findOne({
      where: {
        userId,
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
    operationId: 'update',
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
    @Body() update: MonitorRequest,
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
    operationId: 'delete',
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
