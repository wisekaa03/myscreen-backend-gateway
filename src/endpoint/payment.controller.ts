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
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { PaymentService } from '@/database/payment.service';
import { UserRoleEnum } from '@/enums';
import { TypeOrmFind } from '@/shared/typeorm.find';

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
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: PaymentsGetRequest,
  ): Promise<PaymentsGetResponse> {
    const [data, count] = await this.paymentService.find({
      ...paginationQueryToConfig(scope),
      select,
      where: TypeOrmFind.Where(where, user),
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }
}
