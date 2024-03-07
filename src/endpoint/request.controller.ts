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
  RequestPrecalcPromoRequest,
  RequestPrecalcResponse,
  RequestPrecalcSumRequest,
} from '@/dto';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { CRUD, Status, UserRoleEnum } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { WSGateway } from '@/websocket/ws.gateway';
import { UserService } from '@/database/user.service';
import { RequestService } from '@/database/request.service';
import { RequestEntity } from '@/database/request.entity';

@ApiComplexDecorators('application', [
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
])
export class RequestController {
  logger = new Logger(RequestController.name);

  constructor(
    private readonly userService: UserService,
    private readonly requestService: RequestService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'requests-get',
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
    @Body() { where: origWhere, select, scope }: ApplicationsGetRequest,
  ): Promise<ApplicationsGetResponse> {
    const { id: userId } = user;
    const where = TypeOrmFind.where(RequestEntity, origWhere);
    if (user.role === UserRoleEnum.MonitorOwner) {
      const [data, count] = await this.requestService.findAndCount({
        ...paginationQueryToConfig(scope),
        select,
        where: [
          { userId, hide: false, ...where, buyerId: Not(user.id) },
          { userId, hide: false, ...where, sellerId: Not(user.id) },
        ],
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    if (user.role === UserRoleEnum.Advertiser) {
      const [data, count] = await this.requestService.findAndCount({
        ...paginationQueryToConfig(scope),
        select,
        where: [
          { userId, hide: false, ...where, buyerId: user.id },
          { userId, hide: false, ...where, sellerId: user.id },
        ],
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    const [data, count] = await this.requestService.findAndCount({
      ...paginationQueryToConfig(scope),
      select,
      where,
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
    const data = await this.requestService.findOne({
      where: {
        id,
      },
    });
    if (!data) {
      throw new NotFoundException('Request not found');
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
    const application = await this.requestService.findOne({
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
      throw new NotFoundException('Request not found');
    }

    const data = await this.requestService.update(applicationId, update);
    if (!data) {
      throw new BadRequestException('Request exists and not exists ?');
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
    const application = await this.requestService.findOne({
      where: [
        { id, sellerId: user.id },
        { id, buyerId: user.id },
      ],
      relations: { monitor: true },
    });
    if (!application) {
      throw new NotFoundException(`Application "${id}" is not found`);
    }

    const { affected } = await this.requestService.delete(application);
    if (!affected) {
      throw new NotFoundException('This application is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Post('precalc-promo')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'request-precalc-promo',
    summary: 'Возвращает предрасчет мониторов (для promo)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: RequestPrecalcResponse,
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
    }: RequestPrecalcPromoRequest,
  ): Promise<RequestPrecalcResponse> {
    const sum = await this.requestService.precalculatePromo({
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

  @Post('precalc-sum')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'request-precalc-sum',
    summary: 'Возвращает предрасчет мониторов (для суммы списания)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: RequestPrecalcResponse,
  })
  @Crud(CRUD.READ)
  async precalculateSum(
    @Req() { user }: ExpressRequest,
    @Body()
    {
      playlistId,
      minWarranty,
      price1s,
      dateBefore,
      dateWhen,
    }: RequestPrecalcSumRequest,
  ): Promise<RequestPrecalcResponse> {
    const sum = await this.requestService.precalculateSum({
      user,
      minWarranty,
      price1s,
      dateBefore: new Date(dateBefore),
      dateWhen: new Date(dateWhen),
      playlistId,
    });

    return {
      status: Status.Success,
      data: { sum: String(sum) },
    };
  }
}
