import type { Request as ExpressRequest } from 'express';
import { Between, FindManyOptions, In, MoreThan, Not } from 'typeorm';
import {
  BadRequestException,
  Body,
  Delete,
  ForbiddenException,
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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { isDateString } from 'class-validator';

import {
  MonitorGetResponse,
  MonitorsGetRequest,
  MonitorsGetResponse,
  MonitorsPlaylistAttachRequest,
  ApplicationsGetResponse,
  SuccessResponse,
  MonitorCreateRequest,
  MonitorUpdateRequest,
  Order,
} from '@/dto';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import {
  CRUD,
  ApplicationApproved,
  Status,
  UserPlanEnum,
  UserRoleEnum,
} from '@/enums';
import { ApiComplexDecorators, Crud, Roles } from '@/decorators';
import { WSGateway } from '@/websocket/ws.gateway';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserService } from '@/database/user.service';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorService } from '@/database/monitor.service';
import { PlaylistService } from '@/database/playlist.service';
import { ApplicationService } from '@/database/application.service';

@ApiComplexDecorators('monitor', [
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
])
export class MonitorController {
  logger = new Logger(MonitorController.name);

  constructor(
    private readonly monitorService: MonitorService,
    private readonly userService: UserService,
    private readonly playlistService: PlaylistService,
    private readonly applicationService: ApplicationService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Post()
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Crud(CRUD.READ)
  async getMonitors(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: MonitorsGetRequest,
  ): Promise<MonitorsGetResponse> {
    const conditional: FindManyOptions<MonitorEntity> = {
      ...paginationQueryToConfig(scope),
      select,
    };
    if (user.role === UserRoleEnum.Monitor) {
      // добавляем то, что содержится у нас в userId: monitorId.
      conditional.where = { id: user.id, ...TypeOrmFind.Where(where) };
    } else if (user.role === UserRoleEnum.MonitorOwner) {
      conditional.where = { userId: user.id, ...TypeOrmFind.Where(where) };
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
            approved: Not(ApplicationApproved.DENIED),
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
      user.id,
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

  @Put()
  @Roles([UserRoleEnum.Administrator, UserRoleEnum.MonitorOwner])
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
  @Crud(CRUD.CREATE)
  async createMonitors(
    @Req() { user }: ExpressRequest,
    @Body() monitor: MonitorCreateRequest,
  ): Promise<MonitorGetResponse> {
    const findMonitor = await this.monitorService.findOne(user.id, {
      select: ['id', 'name', 'code'],
      where: { code: monitor.code },
    });
    if (findMonitor) {
      throw new BadRequestException(
        `Монитор '${findMonitor.name}'/'${findMonitor.code}' уже существует`,
      );
    }
    const [, countMonitors] = await this.monitorService.findAndCount(user.id, {
      select: ['id'],
      where: { userId: user.id },
    });
    if (countMonitors > 5) {
      throw new ForbiddenException(
        'You have a Demo User account. There are 5 monitors limit.',
      );
    }

    const data = await this.monitorService
      .update(user.id, monitor)
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

  @Patch('playlist')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ])
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
  @Crud(CRUD.CREATE)
  async createMonitorPlaylist(
    @Req() { user }: ExpressRequest,
    @Body() attach: MonitorsPlaylistAttachRequest,
  ): Promise<MonitorsGetResponse> {
    if (!Array.isArray(attach.monitors) || attach.monitors.length < 1) {
      throw new BadRequestException('Monitors should not be null or undefined');
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

    // TODO: 1. Забронированное и доступное время для создания заявки
    // TODO: 1.1. При подачи заявки Рекламодателем нужно проверять нет ли пересечения
    // TODO: с другими заявки в выбранные дни/часы. Если есть, то выдавать ошибку.
    // TODO: 1.2. Во время проверок нужно учитывать заявки со статусом NotProcessing
    // TODO: и Approved. Заявки со статусом Denied не участвуют, так как они уже не актуальны.
    if (user.role === UserRoleEnum.Advertiser) {
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
            approved: Not(ApplicationApproved.DENIED),
          },
        });
        if (approved.length > 0) {
          throw new NotAcceptableException('This time is overlapped');
        }
      });
      await Promise.all(tryPromise);
    }

    const dataPromise = attach.monitors.map(async (monitorId) => {
      let monitor = await this.monitorService.findOne(user.id, {
        where: {
          id: monitorId,
        },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }

      monitor = await this.monitorService.update(user.id, {
        ...monitor,
        playlist,
      });

      if (
        user.role !== UserRoleEnum.Monitor &&
        user.plan !== UserPlanEnum.Demo
      ) {
        let approved: ApplicationApproved;
        if (monitor.userId === user.id) {
          approved = ApplicationApproved.ALLOWED;
        } else {
          approved = ApplicationApproved.NOTPROCESSED;
        }
        // To verify user permissions for application
        this.userService.verify(
          user,
          'application',
          'updateApplication',
          CRUD.CREATE,
        );
        // To create application
        await this.applicationService.update(undefined, {
          sellerId: monitor.userId,
          buyerId: user.id,
          monitor,
          playlist,
          approved,
          user,
          dateBefore: attach.application.dateBefore,
          dateWhen: attach.application.dateWhen,
          playlistChange: attach.application.playlistChange,
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

  @Delete('playlist')
  @HttpCode(200)
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ])
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
  @Crud(CRUD.DELETE)
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
      const monitor = await this.monitorService.findOne(user.id, {
        where: {
          userId: user.id,
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

      return this.monitorService.update(user.id, {
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

  @Get(':monitorId')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Crud(CRUD.READ)
  async getMonitor(
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<MonitorGetResponse> {
    const conditional: FindManyOptions<MonitorEntity> = {};
    if (user.role === UserRoleEnum.Monitor) {
      conditional.where = { id: user.id };
    } else {
      conditional.where = { userId: user.id, id };
    }
    const data = await this.monitorService.findOne(user.id, conditional);
    if (!data) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get(':monitorId/favoritePlus')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-favorite-plus',
    summary: "Избранное '+'",
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async monitorFavoritePlus(
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) monitorId: string,
  ): Promise<MonitorGetResponse> {
    const data = await this.monitorService.favorite(user, monitorId, true);
    if (!data) {
      throw new NotFoundException(`Monitor '${monitorId}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get(':monitorId/favoriteMinus')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-favorite-minus',
    summary: "Избранное '-'",
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async monitorFavoriteMinus(
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) monitorId: string,
  ): Promise<MonitorGetResponse> {
    const data = await this.monitorService.favorite(user, monitorId, false);
    if (!data) {
      throw new NotFoundException(`Monitor '${monitorId}' not found`);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get(':monitorId/applications')
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Monitor,
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-get-applications',
    summary: 'Получение плэйлиста монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationsGetResponse,
  })
  @Crud(CRUD.READ)
  async getMonitorApplications(
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<ApplicationsGetResponse> {
    const conditional: FindManyOptions<MonitorEntity> = {
      relations: ['playlist'],
    };
    if (user.role === UserRoleEnum.Monitor) {
      conditional.where = { id: user.id };
    } else {
      conditional.where = { userId: user.id, id };
    }
    const monitor = await this.monitorService.findOne(user.id, conditional);
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }
    if (!monitor.playlist) {
      throw new NotFoundException(`Have no playlist in monitor '${id}'`);
    }

    const data = await this.applicationService.monitorApplications({
      monitorId: monitor.id,
    });

    return {
      status: Status.Success,
      count: data.length,
      data,
    };
  }

  @Patch(':monitorId')
  @Roles([UserRoleEnum.Administrator, UserRoleEnum.MonitorOwner])
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
  @Crud(CRUD.UPDATE)
  async updateMonitor(
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
    @Body() update: MonitorUpdateRequest,
  ): Promise<MonitorGetResponse> {
    const monitor = await this.monitorService.findOne(user.id, {
      select: ['id'],
      loadEagerRelations: false,
      where: {
        userId: user.id,
        id,
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor ${id} is not found`);
    }
    const data = await this.monitorService.update(user.id, {
      ...update,
      id,
    });

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete(':monitorId')
  @Roles([UserRoleEnum.Administrator, UserRoleEnum.MonitorOwner])
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
  @Crud(CRUD.DELETE)
  async deleteMonitor(
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const monitor = await this.monitorService.findOne(user.id, {
      select: ['id'],
      loadEagerRelations: false,
      where: {
        userId: user.id,
        id,
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' is not found`);
    }

    const { affected } = await this.monitorService.delete(user.id, monitor);
    if (!affected) {
      throw new NotFoundException('This monitor is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
