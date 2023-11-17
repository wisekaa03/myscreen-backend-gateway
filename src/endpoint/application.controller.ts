import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
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
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Not } from 'typeorm';

import {
  ApplicationsGetRequest,
  ApplicationGetResponse,
  ApplicationsGetResponse,
  ApplicationUpdateRequest,
  SuccessResponse,
  ApplicationPrecalculateRequest,
  ApplicationPrecalculateResponse,
} from '@/dto';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { CRUD, Status, UserRoleEnum } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { WSGateway } from '@/websocket/ws.gateway';
import { UserService } from '@/database/user.service';
import { ApplicationService } from '@/database/application.service';

@ApiComplexDecorators('application', [
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
])
export class ApplicationController {
  logger = new Logger(ApplicationController.name);

  constructor(
    private readonly userService: UserService,
    private readonly applicationService: ApplicationService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'applications-get',
    summary: 'Получение списка заявок',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationsGetResponse,
  })
  @Crud(CRUD.READ)
  async findMany(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: ApplicationsGetRequest,
  ): Promise<ApplicationsGetResponse> {
    const sqlWhere = TypeOrmFind.Where(where);
    if (user.role === UserRoleEnum.MonitorOwner) {
      const [data, count] = await this.applicationService.findAndCount({
        ...paginationQueryToConfig(scope),
        select,
        where: [
          { hide: false, ...sqlWhere, buyerId: Not(user.id) },
          { hide: false, ...sqlWhere, sellerId: Not(user.id) },
        ],
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    if (user.role === UserRoleEnum.Advertiser) {
      const [data, count] = await this.applicationService.findAndCount({
        ...paginationQueryToConfig(scope),
        select,
        where: [
          { hide: false, ...sqlWhere, buyerId: user.id },
          { hide: false, ...sqlWhere, sellerId: user.id },
        ],
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    const [data, count] = await this.applicationService.findAndCount({
      ...paginationQueryToConfig(scope),
      select,
      where: TypeOrmFind.Where(where),
    });
    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Get(':applicationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'application-get',
    summary: 'Получение заявки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationGetResponse,
  })
  @Crud(CRUD.READ)
  async findOne(
    @Param('applicationId', ParseUUIDPipe) id: string,
  ): Promise<ApplicationGetResponse> {
    const data = await this.applicationService.findOne({
      where: {
        id,
      },
    });
    if (!data) {
      throw new NotFoundException('Application not found');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch(':applicationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'application-update',
    summary: 'Изменить заявку',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async update(
    @Req() { user }: ExpressRequest,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() update: ApplicationUpdateRequest,
  ): Promise<ApplicationGetResponse> {
    const application = await this.applicationService.findOne({
      where: [
        {
          id: applicationId,
          sellerId: user.id,
        },
        {
          id: applicationId,
          buyerId: user.id,
        },
      ],
      select: ['id'],
      relations: [],
      loadEagerRelations: false,
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const data = await this.applicationService.update({
      ...update,
      id: applicationId,
    });
    if (!data) {
      throw new BadRequestException('Application exists and not exists ?');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete(':applicationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'application-delete',
    summary: 'Удаление заявки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  @Crud(CRUD.DELETE)
  async delete(
    @Req() { user }: ExpressRequest,
    @Param('applicationId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const application = await this.applicationService.findOne({
      where: [
        { id, sellerId: user.id },
        { id, buyerId: user.id },
      ],
      relations: { monitor: true },
    });
    if (!application) {
      throw new NotFoundException(`Application "${id}" is not found`);
    }

    const { affected } = await this.applicationService.delete(application);
    if (!affected) {
      throw new NotFoundException('This application is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Post('precalculate')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'application-precalculate',
    summary: 'Возвращает предрасчет мониторов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationPrecalculateResponse,
  })
  @Crud(CRUD.READ)
  async precalculate(
    @Req() { user }: ExpressRequest,
    @Body()
    {
      monitorIds,
      playlistDuration,
      dateFrom,
      dateTo,
    }: ApplicationPrecalculateRequest,
  ): Promise<ApplicationPrecalculateResponse> {
    const sum = await this.applicationService.precalculate({
      user,
      monitorIds,
      playlistDuration,
      dateFrom,
      dateTo,
    });

    return {
      status: Status.Success,
      data: { sum },
    };
  }
}
