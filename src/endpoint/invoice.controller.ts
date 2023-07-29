import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotAcceptableException,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Put,
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
import { FindOptionsWhere } from 'typeorm';

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  InvoiceCreateRequest,
  InvoicesGetRequest,
  InvoicesGetResponse,
  NotFoundError,
  InvoiceGetResponse,
  ServiceUnavailableError,
  UnauthorizedError,
  NotAcceptableError,
} from '@/dto';
import { Status, UserRoleEnum, SpecificFormat, InvoiceStatus } from '@/enums';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { formatToContentType } from '@/utils/format-to-content-type';
import { InvoiceService } from '@/database/invoice.service';
import { InvoiceEntity } from '@/database/invoice.entity';

@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Ответ будет таким если с данным что-то не так',
  type: BadRequestError,
})
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Ответ для незарегистрированного пользователя',
  type: UnauthorizedError,
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Ответ для неавторизованного пользователя',
  type: ForbiddenError,
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: 'Не найдено',
  type: NotFoundError,
})
@ApiResponse({
  status: HttpStatus.NOT_ACCEPTABLE,
  description: 'Не принято значение',
  type: NotAcceptableError,
})
@ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@ApiResponse({
  status: HttpStatus.SERVICE_UNAVAILABLE,
  description: 'Не доступен сервис',
  type: ServiceUnavailableError,
})
@Roles(
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
  UserRoleEnum.Accountant,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('invoice')
@Controller('invoice')
export class InvoiceController {
  logger = new Logger(InvoiceController.name);

  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'invoices-get',
    summary: 'Получение списка счётов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: InvoicesGetResponse,
  })
  async getOrders(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: InvoicesGetRequest,
  ): Promise<InvoicesGetResponse> {
    const whenUser =
      user.role === UserRoleEnum.Administrator ||
      user.role === UserRoleEnum.Accountant
        ? undefined
        : user;
    const [data, count] = await this.invoiceService.find({
      ...paginationQueryToConfig(scope),
      select,
      where: TypeOrmFind.Where(where, whenUser),
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Put()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'invoice-create',
    summary: 'Выставление счетов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: InvoiceGetResponse,
  })
  async invoice(
    @Req() { user }: ExpressRequest,
    @Body() { sum, description }: InvoiceCreateRequest,
  ): Promise<InvoiceGetResponse> {
    const invoice = await this.invoiceService.create(
      user,
      sum,
      description ?? 'Autogenerated invoice',
    );

    return {
      status: Status.Success,
      data: invoice,
    };
  }

  @Get('confirmed/:invoiceId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'invoice-confirmed',
    summary: 'Подтверждение/отклонение счёта (только бухгалтер)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: InvoiceGetResponse,
  })
  @Roles(UserRoleEnum.Administrator, UserRoleEnum.Accountant)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async confirmed(
    @Param('invoiceId', ParseUUIDPipe) id: string,
  ): Promise<InvoiceGetResponse> {
    const invoice = await this.invoiceService.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!invoice) {
      throw new NotFoundException();
    }
    if (invoice.status !== InvoiceStatus.AWAITING_CONFIRMATION) {
      throw new NotAcceptableException();
    }

    const data = await this.invoiceService.statusChange(
      invoice.user,
      invoice,
      InvoiceStatus.CONFIRMED_PENDING_PAYMENT,
    );

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('payed/:invoiceId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'invoice-payed',
    summary: 'Оплата по счету (только бухгалтер)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
  })
  @Roles(UserRoleEnum.Administrator, UserRoleEnum.Accountant)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async payed(
    @Param('invoiceId', ParseUUIDPipe) id: string,
  ): Promise<InvoiceGetResponse> {
    const invoice = await this.invoiceService.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!invoice) {
      throw new NotFoundException();
    }
    if (invoice.status !== InvoiceStatus.CONFIRMED_PENDING_PAYMENT) {
      throw new NotAcceptableException();
    }

    const data = await this.invoiceService.statusChange(
      invoice.user,
      invoice,
      InvoiceStatus.PAID,
    );

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('download/:invoiceId/:format')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'invoice-download',
    summary: 'Метод для скачивания файла excel/pdf/etc',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    content: {
      'application/vnd.ms-excel': {
        encoding: {
          ms_excel: {
            contentType: formatToContentType[SpecificFormat.XLSX],
          },
        },
      },
      'application/pdf': {
        encoding: {
          pdf: {
            contentType: formatToContentType[SpecificFormat.PDF],
          },
        },
      },
    },
  })
  async download(
    @Req() { user }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Param('invoiceId', ParseUUIDPipe) id: string,
    @Param('format', new ParseEnumPipe(SpecificFormat)) format: SpecificFormat,
  ): Promise<void> {
    const where: FindOptionsWhere<InvoiceEntity> = { id };
    if (
      user.role !== UserRoleEnum.Administrator &&
      user.role !== UserRoleEnum.Accountant
    ) {
      where.userId = user.id;
    }
    const invoice = await this.invoiceService.findOne({
      where,
      relations: ['user'],
    });
    if (!invoice) {
      throw new NotFoundException();
    }

    await this.invoiceService.download(invoice.user, res, invoice, format);
  }
}
