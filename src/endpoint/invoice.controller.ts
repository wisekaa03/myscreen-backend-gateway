import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  BadRequestException,
  Body,
  Get,
  HttpCode,
  InternalServerErrorException,
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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindOptionsWhere } from 'typeorm';

import {
  InvoiceCreateRequest,
  InvoicesGetRequest,
  InvoicesGetResponse,
  InvoiceGetResponse,
} from '@/dto';
import {
  Status,
  UserRoleEnum,
  SpecificFormat,
  InvoiceStatus,
  CRUD,
} from '@/enums';
import { ApiComplexDecorators, Crud, Roles } from '@/decorators';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { paginationQuery } from '@/utils/pagination-query';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { formatToContentType } from '@/utils/format-to-content-type';
import { InvoiceService } from '@/database/invoice.service';
import { InvoiceEntity } from '@/database/invoice.entity';

@ApiComplexDecorators({
  path: ['invoice'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Accountant,
  ],
})
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
  @Crud(CRUD.READ)
  async getOrders(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: InvoicesGetRequest,
  ): Promise<InvoicesGetResponse> {
    const whenUserId =
      user.role === UserRoleEnum.Administrator ||
      user.role === UserRoleEnum.Accountant
        ? undefined
        : user.id;
    const [data, count] = await this.invoiceService.find({
      ...paginationQuery(scope),
      select,
      where: { ...TypeOrmFind.where(InvoiceEntity, where), userId: whenUserId },
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
  @Crud(CRUD.CREATE)
  async invoice(
    @Req() { user }: ExpressRequest,
    @Body() { sum, description }: InvoiceCreateRequest,
  ): Promise<InvoiceGetResponse> {
    if (sum < this.invoiceService.minInvoiceSum) {
      throw new BadRequestException(
        `The sum must be more or equal than ${this.invoiceService.minInvoiceSum}`,
      );
    }
    const invoice = await this.invoiceService.create(
      user,
      sum,
      description ?? 'Autogenerated invoice',
    );
    if (!invoice) {
      throw new InternalServerErrorException();
    }

    await this.invoiceService.statusChange(
      invoice,
      InvoiceStatus.AWAITING_CONFIRMATION,
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
  @Roles([UserRoleEnum.Administrator, UserRoleEnum.Accountant])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Crud(CRUD.UPDATE)
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
      throw new NotAcceptableException('Invoice is not awaiting confirmation');
    }

    const data = await this.invoiceService.statusChange(
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
  @Roles([UserRoleEnum.Administrator, UserRoleEnum.Accountant])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Crud(CRUD.UPDATE)
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
      throw new NotAcceptableException('Invoice is not confirmed');
    }

    const data = await this.invoiceService.statusChange(
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
  @Crud(CRUD.READ)
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

    await this.invoiceService.download(res, format, invoice);
  }
}
