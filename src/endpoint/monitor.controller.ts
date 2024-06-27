import type { Request as ExpressRequest } from 'express';
import {
  Between,
  FindManyOptions,
  FindOptionsWhere,
  In,
  MoreThan,
  Not,
} from 'typeorm';
import {
  BadRequestException,
  Body,
  Delete,
  ForbiddenException,
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
import { isDateString } from 'class-validator';

import {
  MonitorGetResponse,
  MonitorsGetRequest,
  MonitorsGetResponse,
  MonitorsPlaylistAttachRequest,
  BidsGetResponse,
  SuccessResponse,
  MonitorCreateRequest,
  MonitorUpdateRequest,
  Order,
} from '@/dto';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import {
  CRUD,
  BidApprove,
  Status,
  UserPlanEnum,
  UserRoleEnum,
  MonitorMultiple,
} from '@/enums';
import { ApiComplexDecorators, Crud, Roles } from '@/decorators';
import { paginationQuery } from '@/utils/pagination-query';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserService } from '@/database/user.service';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorService } from '@/database/monitor.service';
import { PlaylistService } from '@/database/playlist.service';
import { BidService } from '@/database/bid.service';

@ApiComplexDecorators({
  path: ['monitor'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ],
})
export class MonitorController {
  logger = new Logger(MonitorController.name);

  constructor(
    private readonly userService: UserService,
    private readonly monitorService: MonitorService,
    private readonly playlistService: PlaylistService,
    private readonly bidService: BidService,
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
    const { id: userId, role } = user;
    const find: FindManyOptions<MonitorEntity> = {
      ...paginationQuery(scope),
      select,
      relations: { favorities: true, groupMonitors: true },
    };
    if (role === UserRoleEnum.Monitor) {
      // добавляем то, что содержится у нас в userId: monitorId.
      find.where = {
        id: userId,
        ...TypeOrmFind.where(MonitorEntity, where),
      };
    } else if (role === UserRoleEnum.MonitorOwner) {
      find.where = {
        userId,
        ...TypeOrmFind.where(MonitorEntity, where),
      };
    } else if (role === UserRoleEnum.Administrator) {
      find.where = {
        ...TypeOrmFind.where(MonitorEntity, where),
      };
    } else {
      find.where = {
        ...TypeOrmFind.where(MonitorEntity, where),
        user: {
          plan: Not(UserPlanEnum.Demo),
        },
        price1s: MoreThan(0),
        minWarranty: MoreThan(0),
        maxDuration: MoreThan(0),
      };
    }
    if (
      where?.dateWhenApp &&
      Array.isArray(where.dateWhenApp) &&
      where.dateWhenApp.length === 2 &&
      isDateString(where.dateWhenApp[0]) &&
      isDateString(where.dateWhenApp[1])
    ) {
      const bidsWhen = await this.bidService.find(
        {
          where: {
            dateWhen: Not(Between(where.dateWhenApp[0], where.dateWhenApp[1])),
            approved: Not(BidApprove.DENIED),
          },
          select: {
            monitorId: true,
          },
          relations: {},
          loadEagerRelations: false,
        },
        false,
      );
      find.where = {
        id: In(bidsWhen.map((bid) => bid.monitorId)),
      };
    }
    const [data, count] = await this.monitorService.findAndCount({
      userId,
      find,
    });
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
  async create(
    @Req() { user }: ExpressRequest,
    @Body() { groupIds, ...insert }: MonitorCreateRequest,
  ): Promise<MonitorGetResponse> {
    const { id: userId, role, plan } = user;
    const { multiple = MonitorMultiple.SINGLE } = insert;
    if (multiple === MonitorMultiple.SUBORDINATE) {
      throw new BadRequestException(
        "Monitor with 'multiple'='SUBORDINATE' can not be created",
      );
    }
    if (multiple === MonitorMultiple.SINGLE) {
      const findMonitor = await this.monitorService.findOne({
        find: {
          where: { code: insert.code },
          select: ['id', 'name', 'code'],
        },
      });
      if (findMonitor) {
        throw new BadRequestException(
          `Monitor with code '${findMonitor.code}' already exists`,
        );
      }
    }
    const where: FindOptionsWhere<MonitorEntity> = { name: insert.name };
    if (role !== UserRoleEnum.Administrator) {
      where.userId = userId;
    }
    const findMonitor = await this.monitorService.findOne({
      find: {
        where,
        select: ['id', 'name'],
      },
    });
    if (findMonitor) {
      throw new BadRequestException(
        `Monitor already exists: '${findMonitor.name}'#'${findMonitor.id}'`,
      );
    }

    if (role !== UserRoleEnum.Administrator && plan === UserPlanEnum.Demo) {
      const countMonitors = await this.monitorService.count({
        find: {
          select: ['id'],
          where: { userId: user.id },
          relations: {},
        },
      });
      if (countMonitors > 5) {
        throw new ForbiddenException(
          'You have a Demo User account. There are 5 monitors limit.',
        );
      }
    }

    const data = await this.monitorService.create({
      user,
      insert,
      groupIds,
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
    @Body()
    {
      playlistId,
      monitorIds,
      bid: { dateBefore, dateWhen, playlistChange },
    }: MonitorsPlaylistAttachRequest,
  ): Promise<BidsGetResponse> {
    // To verify user permissions for bid
    this.userService.verify(user, 'bid', 'updateBid', CRUD.CREATE);

    // TODO: 1. Забронированное и доступное время для создания заявки
    // TODO: 1.1. При подачи заявки Рекламодателем нужно проверять нет ли пересечения
    // TODO: с другими заявки в выбранные дни/часы. Если есть, то выдавать ошибку.
    // TODO: 1.2. Во время проверок нужно учитывать заявки со статусом NotProcessing
    // TODO: и Approved. Заявки со статусом Denied не участвуют, так как они уже не актуальны.
    // const approved = await this.bidService.find({
    //   where: {
    //     monitorId: In(monitorIds),
    //     dateWhen: dateBefore ? Between(dateWhen, dateBefore) : dateWhen,
    //     // Подсчитываем все заявки, кроме Denied, в том числе и NotProcessing
    //     approved: Not(BidApprove.DENIED),
    //   },
    // });
    // if (approved.length > 0) {
    //   throw new NotAcceptableException('This time is overlapped');
    // }

    // To create bids
    const data = await this.bidService.create({
      user,
      playlistId,
      monitorIds,
      dateBefore: dateBefore ? new Date(dateBefore) : null,
      dateWhen: new Date(dateWhen),
      playlistChange,
    });

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
    if (attach.monitorIds.length === 0) {
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

    const dataPromise = attach.monitorIds.map(async (monitorId) => {
      const monitor = await this.monitorService.findOne({
        userId: user.id,
        find: {
          where: {
            userId: user.id,
            id: monitorId,
          },
        },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }
      if (!monitor.playlist) {
        throw new NotFoundException(
          `Monitor '${monitorId}' is not playing playlist "${playlist.name}"`,
        );
      }

      return this.monitorService.update(monitor.id, {
        playlist: null,
      });
    });
    const data = await Promise.all(dataPromise);

    return {
      status: Status.Success,
      count: data.length,
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
    const { id: userId, role } = user;
    const find: FindManyOptions<MonitorEntity> = {};
    if (role === UserRoleEnum.Monitor) {
      find.where = { id: userId };
    } else if (role === UserRoleEnum.Administrator) {
      find.where = { id };
    } else {
      find.where = { userId, id };
    }
    const data = await this.monitorService.findOne({
      userId,
      find,
    });
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
    operationId: 'monitor-get-bid',
    summary: 'Получение плэйлиста монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: BidsGetResponse,
  })
  @Crud(CRUD.READ)
  async getMonitorApplications(
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<BidsGetResponse> {
    const { id: userId, role } = user;
    const find: FindManyOptions<MonitorEntity> = {
      relations: ['playlist'],
    };
    if (role === UserRoleEnum.Monitor) {
      find.where = { id: userId };
    } else if (role === UserRoleEnum.Administrator) {
      find.where = { id };
    } else {
      find.where = { userId, id };
    }
    const monitor = await this.monitorService.findOne({
      userId,
      find,
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }
    if (!monitor.playlist) {
      throw new NotFoundException(`Have no playlist in monitor '${id}'`);
    }

    const data = await this.bidService.monitorRequests({
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
  async update(
    @Req() { user }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
    @Body() { groupIds, ...update }: MonitorUpdateRequest,
  ): Promise<MonitorGetResponse> {
    const { id: userId, role } = user;
    const where: FindOptionsWhere<MonitorEntity> = { id };
    if (role !== UserRoleEnum.Administrator) {
      where.userId = userId;
    }
    const foundMonitorIds = groupIds?.find(
      (monitor) => monitor.monitorId === id,
    );
    if (foundMonitorIds) {
      throw new BadRequestException(`Monitor '${id}' is found in groupIds`);
    }
    const monitor = await this.monitorService.findOne({
      userId,
      find: {
        where,
        select: ['id'],
        loadEagerRelations: false,
        relations: {},
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' is not found`);
    }
    const data = await this.monitorService.update(id, update, groupIds);

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
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Param('monitorId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const where: FindOptionsWhere<MonitorEntity> = { id };
    if (role !== UserRoleEnum.Administrator) {
      where.userId = userId;
    }
    const monitor = await this.monitorService.findOne({
      find: {
        where,
        select: ['id', 'name', 'multiple', 'groupMonitors'],
        loadEagerRelations: false,
        relations: { groupMonitors: true },
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor '${id}' not found`);
    }

    const { affected } = await this.monitorService.delete(monitor);
    if (!affected) {
      throw new NotFoundException('This monitor is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
