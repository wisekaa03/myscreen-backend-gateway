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
  Status,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { OrderService } from '@/database/order.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';

@ApiTags('order')
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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('/order')
export class OrderController {
  logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'orders_get',
    summary: 'Получение списка заказов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: OrdersGetResponse,
  })
  async getOrders(
    @Req() { user }: ExpressRequest,
    @Body() { where, scope }: OrdersGetRequest,
  ): Promise<OrdersGetResponse> {
    const [data, count] = await this.orderService.find({
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
}
