import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { Body, HttpCode, Inject, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { In } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import { PrintReportDeviceStatus } from '@/interfaces';
import { MAIL_SERVICE, formatToContentType } from '@/constants';
import { ReportDeviceStatusRequest, ReportViewsRequest } from '@/dto';
import { UserRoleEnum, SpecificFormat, CRUD } from '@/enums';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { MonitorService } from '@/database/monitor.service';
import { MonitorEntity } from '@/database/monitor.entity';
import { UserService } from '@/database/user.service';

@ApiComplexDecorators({
  path: ['statistics'],
  roles: [
    UserRoleEnum.Administrator,
    UserRoleEnum.Accountant,
    UserRoleEnum.Advertiser,
    UserRoleEnum.MonitorOwner,
  ],
})
export class StatisticsController {
  logger = new Logger(StatisticsController.name);

  constructor(
    private readonly userService: UserService,
    private readonly monitorService: MonitorService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: ClientProxy,
  ) {}

  @Post('deviceStatus')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'deviceStatus',
    summary: 'Отчёт по статусу устройства',
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
  @Crud(CRUD.STATUS)
  async reportDeviceStatus(
    @Req() { user }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Body() { format, monitorIds, dateFrom, dateTo }: ReportDeviceStatusRequest,
  ): Promise<void> {
    let monitors: MonitorEntity[] | undefined;
    if (Array.isArray(monitorIds) && monitorIds.length > 0) {
      monitors = await this.monitorService.find({
        userId: user.id,
        find: {
          where: { userId: user.id, id: In(monitorIds) },
        },
      });
    }

    const data = await lastValueFrom(
      this.mailService.send<unknown, PrintReportDeviceStatus>(
        'reportDeviceStatus',
        {
          user,
          monitors,
          format,
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
        },
      ),
    );

    const specificFormat = formatToContentType[format]
      ? format
      : SpecificFormat.XLSX;

    res.statusCode = 200;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-device-status.${specificFormat}"`,
    );
    res.setHeader('Content-Type', formatToContentType[format]);

    res.end(data, 'binary');
  }

  @Post('reportViews')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'reportViews',
    summary: 'Отчёт по показам',
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
  @Crud(CRUD.STATUS)
  async reportViews(
    @Req() { user }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Body() { format, monitorIds, dateFrom, dateTo }: ReportViewsRequest,
  ): Promise<void> {
    let monitors: MonitorEntity[] | undefined;
    if (Array.isArray(monitorIds) && monitorIds.length > 0) {
      monitors = await this.monitorService.find({
        userId: user.id,

        find: {
          where: { userId: user.id, id: In(monitorIds) },
        },
      });
    }

    const data = await lastValueFrom(
      this.mailService.send<unknown, PrintReportDeviceStatus>('reportViews', {
        user,
        monitors,
        format,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      }),
    );

    const specificFormat = formatToContentType[format]
      ? format
      : SpecificFormat.XLSX;

    res.statusCode = 200;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-views.${specificFormat}"`,
    );
    res.setHeader('Content-Type', formatToContentType[format]);

    res.end(data, 'binary');
  }
}
