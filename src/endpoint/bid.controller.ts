import { type Request as ExpressRequest } from 'express';
import {
  Body,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Not } from 'typeorm';

import { BadRequestError, NotFoundError } from '@/errors';
import {
  SuccessResponse,
  BidGetResponse,
  BidsGetRequest,
  BidsGetResponse,
  BidUpdateRequest,
  BidPrecalcPromoRequest,
  BidPrecalcSumRequest,
  BidPrecalcResponse,
} from '@/dto';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { BidStatus, CRUD, Status, UserRoleEnum } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { paginationQuery } from '@/utils/pagination-query';
import { BidService } from '@/database/bid.service';
import { BidEntity } from '@/database/bid.entity';

@ApiComplexDecorators({
  path: ['bid'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ],
})
export class BidController {
  logger = new Logger(BidController.name);

  constructor(private readonly bidService: BidService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'bids-get',
    summary: 'Получение списка заявок',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: BidsGetResponse,
  })
  @Crud(CRUD.READ)
  async findMany(
    @Req() { user }: ExpressRequest,
    @Body() { where: origWhere, select, scope }: BidsGetRequest,
  ): Promise<BidsGetResponse> {
    const { id: userId } = user;
    const where = TypeOrmFind.where(BidEntity, origWhere);
    if (user.role === UserRoleEnum.MonitorOwner) {
      const [data, count] = await this.bidService.findAndCount({
        ...paginationQuery(scope),
        select,
        where: [
          {
            hide: false,
            ...where,
            buyerId: Not(userId),
            sellerId: userId,
          },
          {
            hide: false,
            ...where,
            status: BidStatus.WAITING,
            userId,
          },
        ],
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    if (user.role === UserRoleEnum.Advertiser) {
      const [data, count] = await this.bidService.findAndCount({
        ...paginationQuery(scope),
        select,
        where: { hide: false, ...where, buyerId: userId },
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    const [data, count] = await this.bidService.findAndCount({
      ...paginationQuery(scope),
      select,
      where,
    });
    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Get(':bidId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'bid-get',
    summary: 'Получение заявки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: BidGetResponse,
  })
  @Crud(CRUD.READ)
  async findOne(
    @Param('bidId', ParseUUIDPipe) id: string,
  ): Promise<BidGetResponse> {
    const data = await this.bidService.findOne({
      where: {
        id,
      },
    });
    if (!data) {
      throw new NotFoundError('BID_NOT_FOUND', { args: { id } });
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch(':bidId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'bid-update',
    summary: 'Изменить заявку',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: BidGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async update(
    @Req() { user: { role, id: userId } }: ExpressRequest,
    @Param('bidId', ParseUUIDPipe) bidId: string,
    @Body() update: BidUpdateRequest,
  ): Promise<BidGetResponse> {
    if (role !== UserRoleEnum.Administrator) {
      const bid = await this.bidService.findOne({
        where: [
          {
            id: bidId,
            sellerId: userId,
          },
          {
            id: bidId,
            buyerId: userId,
          },
        ],
        select: ['id'],
        relations: {},
        loadEagerRelations: false,
      });
      if (!bid) {
        throw new NotFoundError('BID_NOT_FOUND', { args: { id: bidId } });
      }
    }

    const data = await this.bidService.update(bidId, update);
    if (!data) {
      throw new BadRequestError('Bid exists and not exists ?');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete(':bidId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'bid-delete',
    summary: 'Удаление заявки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  @Crud(CRUD.DELETE)
  async delete(
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Param('bidId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    let bid: BidEntity | null;
    if (role !== UserRoleEnum.Administrator) {
      bid = await this.bidService.findOne({
        where: [
          { id, sellerId: userId },
          { id, buyerId: userId },
        ],
        relations: { monitor: true },
      });
    } else {
      bid = await this.bidService.findOne({ where: { id } });
    }
    if (!bid) {
      throw new NotFoundError('BID_NOT_FOUND', { args: { id } });
    }

    const { affected } = await this.bidService.delete(bid);
    if (!affected) {
      throw new NotFoundError('This bid is not exists');
    }

    return {
      status: Status.Success,
    };
  }

  @Post('precalc-promo')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'bid-precalc-promo',
    summary: 'Возвращает предрасчет мониторов (для promo)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: BidPrecalcResponse,
  })
  @Crud(CRUD.READ)
  async precalculate(
    @Req() { user }: ExpressRequest,
    @Body()
    { monitorIds, playlistDuration, dateFrom, dateTo }: BidPrecalcPromoRequest,
  ): Promise<BidPrecalcResponse> {
    const sum = await this.bidService.precalculatePromo({
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
    operationId: 'bid-precalc-sum',
    summary: 'Возвращает предрасчет мониторов (для суммы списания)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: BidPrecalcResponse,
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
    }: BidPrecalcSumRequest,
  ): Promise<BidPrecalcResponse> {
    const sum = await this.bidService.precalculateSum({
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
