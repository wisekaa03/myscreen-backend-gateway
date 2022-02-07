import type { Request as ExpressRequest } from 'express';
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
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
  NotFoundError,
  OrdersGetRequest,
  OrdersGetResponse,
  ServiceUnavailableError,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { OrderService } from '@/database/order.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { UserRoleEnum } from '@/enums';

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
  description: 'Ошибка медиа',
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
@ApiTags('order')
@Controller('order')
export class OrderController {
  logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'orders-get',
    summary: 'Получение списка заказов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: OrdersGetResponse,
  })
  async getOrders(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { where, scope }: OrdersGetRequest,
  ): Promise<OrdersGetResponse> {
    const [data, count] = await this.orderService.find({
      ...paginationQueryToConfig(scope),
      where: {
        userId,
        ...where,
      },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }
}
