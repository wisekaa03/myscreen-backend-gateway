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
  PaymentsGetRequest,
  PaymentsGetResponse,
  ServiceUnavailableError,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { PaymentService } from '@/database/payment.service';

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
@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'payments-get',
    summary: 'Получение списка оплат',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: PaymentsGetResponse,
  })
  async getPayments(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { where, scope }: PaymentsGetRequest,
  ): Promise<PaymentsGetResponse> {
    const [data, count] = await this.paymentService.find({
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
