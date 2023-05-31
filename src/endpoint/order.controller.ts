import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  Res,
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
  InvoiceRequest,
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
import { TypeOrmFind } from '@/shared/typeorm.find';
import { PrintService } from '@/print/print.service';
import { SpecificFormat } from '@/enums/invoice-format.enum';

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

  constructor(
    private readonly orderService: OrderService,
    private readonly printService: PrintService,
  ) {}

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
    @Body() { where, select, scope }: OrdersGetRequest,
  ): Promise<OrdersGetResponse> {
    const [data, count] = await this.orderService.find({
      ...paginationQueryToConfig(scope),
      select,
      where: TypeOrmFind.Where(where, userId),
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Post('invoice')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'invoice',
    summary: 'Выставление счетов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    content: {
      'application/vnd.ms-excel': {
        encoding: {
          ms_excel: {
            contentType: 'application/vnd.ms-excel',
          },
        },
      },
      'application/pdf': {
        encoding: {
          pdf: {
            contentType: 'application/pdf',
          },
        },
      },
    },
  })
  async invoice(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Body() { format }: InvoiceRequest,
  ): Promise<void> {
    const data = await this.printService.invoice(userId, format);

    res.statusCode = 200;
    switch (format) {
      case SpecificFormat.PDF:
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="invoice.pdf"',
        );
        res.setHeader('Content-Type', 'application/pdf');
        break;

      case SpecificFormat.XLSX:
      default:
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="invoice.xlsx"',
        );
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
    }

    res.end(data, 'binary');
  }
}
