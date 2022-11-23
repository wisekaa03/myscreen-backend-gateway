import type { Request as ExpressRequest } from 'express';
import { Between, FindManyOptions, In, MoreThan, Not } from 'typeorm';
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
  NotAcceptableException,
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

import { isDateString } from 'class-validator';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  MonitorGetResponse,
  MonitorsGetRequest,
  MonitorsGetResponse,
  MonitorsPlaylistAttachRequest,
  NotFoundError,
  ServiceUnavailableError,
  ApplicationsGetResponse,
  SuccessResponse,
  UnauthorizedError,
  MonitorCreateRequest,
  MonitorUpdateRequest,
  Order,
} from '../dto/index';
import { JwtAuthGuard, Roles, RolesGuard } from '../guards/index';
import { ApplicationApproved, Status, UserRoleEnum } from '../enums/index';
import { MonitorService } from '../database/monitor.service';
import { WSGateway } from '../websocket/ws.gateway';
import { paginationQueryToConfig } from '../shared/pagination-query-to-config';
import { PlaylistService } from '../database/playlist.service';
import { MonitorEntity } from '../database/monitor.entity';
import { ApplicationService } from '../database/application.service';
import { TypeOrmFind } from '../shared/typeorm.find';

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
    private readonly applicationService: ApplicationService,
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
    @Body() { where, select, scope }: MonitorsGetRequest,
  ): Promise<MonitorsGetResponse> {
    const conditional: FindManyOptions<MonitorEntity> = {
      ...paginationQueryToConfig(scope),
      select,
    };
    if (role.includes(UserRoleEnum.Monitor)) {
      // добавляем то, что содержится у нас в userId: monitorId.
      conditional.where = { id: userId, ...TypeOrmFind.Where(where) };
    } else if (role.includes(UserRoleEnum.MonitorOwner)) {
      conditional.where = { userId, ...TypeOrmFind.Where(where) };
    } else {
      conditional.where = {
        price1s: MoreThan(0),
        minWarranty: MoreThan(0),
        maxDuration: MoreThan(0),
        ...TypeOrmFind.Where(where),
      };
    }
    if (
      where?.dateWhenApp &&
      Array.isArray(where.dateWhenApp) &&
      where.dateWhenApp.length === 2 &&
      isDateString(where.dateWhenApp[0]) &&
      isDateString(where.dateWhenApp[1])
    ) {
      const applicationsWhen = await this.applicationService.find(
        {
          where: {
            dateWhen: Not(Between(where.dateWhenApp[0], where.dateWhenApp[1])),
            approved: Not(ApplicationApproved.Denied),
          },
          select: {
            monitorId: true,
          },
          relations: [],
        },
        false,
      );
      conditional.where = {
        id: In(applicationsWhen.map((application) => application.monitorId)),
      };
    }
    const [data, count] = await this.monitorService.findAndCount(
      userId,
      conditional,
    );
    if (scope?.order?.favorite) {
      return {
        status: Status.Success,
        count,
        data:
          scope.order.favorite === Order.ASC
            ? data.sort((a, b) => (a.favorite === b.favorite ? 0 : 1))
            : data.sort((a, b) => (a.favorite === b.favorite ? 0 : -1)),
      };
    }

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Put('/')
  @Roles(UserRoleEnum.Administrator, UserRoleEnum.MonitorOwner)
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    const findMonitor = await this.monitorService.findOne(userId, {
      select: ['id', 'name', 'code'],
      where: { code: monitor.code },
    });
    if (findMonitor) {
      throw new BadRequestException(
        `Монитор '${findMonitor.name}'/'${findMonitor.code}' уже существует`,
      );
    }

    const data = await this.monitorService
      .update(userId, monitor)
      .catch((/* error: TypeORMError */) => {
        throw new BadRequestException(
          `Монитор '${monitor.name}' уже существует`,
        );
      });

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch('/playlist')
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    @Req() { user: { id: userId, role } }: ExpressRequest,
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

    // TODO: 1. Забронированное и доступное время для создания заявки
    // TODO: 1.1. При подачи заявки Рекламодателем нужно проверять нет ли пересечения
    // TODO: с другими заявки в выбранные дни/часы. Если есть, то выдавать ошибку.
    // TODO: 1.2. Во время проверок нужно учитывать заявки со статусом NotProcessing
    // TODO: и Approved. Заявки со статусом Denied не участвуют, так как они уже не актуальны.
    if (role.includes(UserRoleEnum.Advertiser)) {
      const tryPromise = attach.monitors.map(async (monitorId) => {
        const approved = await this.applicationService.find({
          where: {
            monitorId,
            dateWhen: attach.application.dateBefore
              ? Between(
                  attach.application.dateWhen,
                  attach.application.dateBefore,
                )
              : attach.application.dateWhen,
            approved: Not(ApplicationApproved.Denied),
          },
        });
        if (approved.length > 0) {
          throw new NotAcceptableException('This time is overlapped');
        }
      });
      await Promise.all(tryPromise);
    }

    const dataPromise = attach.monitors.map(async (monitorId) => {
      let monitor = await this.monitorService.findOne(userId, {
        where: {
          id: monitorId,
        },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }

      monitor = await this.monitorService.update(userId, {
        ...monitor,
        playlist,
      });

      if (!role.includes(UserRoleEnum.Monitor)) {
        let approved: ApplicationApproved;
        if (monitor.userId === userId) {
          approved = ApplicationApproved.Allowed;
        } else {
          approved = ApplicationApproved.NotProcessed;
        }
        await this.applicationService
          .update(undefined, {
            sellerId: monitor.userId,
            buyerId: userId,
            monitor,
            playlist,
            approved,
            userId,
            dateBefore: attach.application.dateBefore,
            dateWhen: attach.application.dateWhen,
            playlistChange: attach.application.playlistChange,
          })
          .catch((error) => {
            this.logger.error(error);
          });
      }

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
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
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
      const monitor = await this.monitorService.findOne(userId, {
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

      /* await */ this.wsGateway
        .application(null, monitor)
        .catch((error: any) => {
          this.logger.error(error);
        });

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
    const data = await this.monitorService.findOne(userId, conditional);
    if (!data) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:monitorId/favoritePlus')
  @HttpCode(200)
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    operationId: 'monitor-favorite-plus',
    summary: 'Избранное +',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorGetResponse,
  })
  async monitorFavoritePlus(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<MonitorGetResponse> {
    const data = await this.monitorService.favorite(userId, id, true);
    if (!data) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:monitorId/favoriteMinus')
  @HttpCode(200)
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    operationId: 'monitor-favorite-minus',
    summary: 'Избранное -',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorGetResponse,
  })
  async monitorFavoriteMinus(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<MonitorGetResponse> {
    const data = await this.monitorService.favorite(userId, id, false);
    if (!data) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:monitorId/applications')
  @HttpCode(200)
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    operationId: 'monitor-get-applications',
    summary: 'Получение плэйлиста монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationsGetResponse,
  })
  async getMonitorApplications(
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<ApplicationsGetResponse> {
    const conditional: FindManyOptions<MonitorEntity> = {
      relations: ['playlist'],
    };
    if (role.includes(UserRoleEnum.Monitor)) {
      conditional.where = { id: userId };
    } else {
      conditional.where = { userId, id };
    }
    const monitor = await this.monitorService.findOne(userId, conditional);
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }
    if (!monitor.playlist) {
      throw new NotFoundException(`Have no playlist in monitor '${id}'`);
    }

    const data = await this.applicationService.monitorApplications(monitor.id);

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Patch('/:monitorId')
  @Roles(UserRoleEnum.Administrator, UserRoleEnum.MonitorOwner)
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    @Body() update: MonitorUpdateRequest,
  ): Promise<MonitorGetResponse> {
    const monitor = await this.monitorService.findOne(userId, {
      select: ['id'],
      loadEagerRelations: false,
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
  @Roles(UserRoleEnum.Administrator, UserRoleEnum.MonitorOwner)
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    const monitor = await this.monitorService.findOne(userId, {
      select: ['id'],
      loadEagerRelations: false,
      where: {
        userId,
        id,
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' is not found`);
    }

    const { affected } = await this.monitorService.delete(userId, id);
    if (!affected) {
      throw new NotFoundException('This monitor is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
