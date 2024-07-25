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
import { formatToContentType } from '@/constants';
import { ReportDeviceStatusRequest, ReportViewsRequest } from '@/dto';
import {
  UserRoleEnum,
  SpecificFormat,
  CRUD,
  MICROSERVICE_MYSCREEN,
  MsvcFormService,
} from '@/enums';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { MonitorService } from '@/database/monitor.service';
import { MonitorEntity } from '@/database/monitor.entity';
import { StatisticsService } from '@/database/statistics.service';

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
    private readonly monitorService: MonitorService,
    private readonly statisticsService: StatisticsService,
    @Inject(MICROSERVICE_MYSCREEN.FORM)
    private readonly formService: ClientProxy,
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
        where: { userId: user.id, id: In(monitorIds) },
        loadEagerRelations: false,
        relations: { playlist: true, user: true },
      });
    } else {
      monitors = await this.monitorService.find({
        userId: user.id,
        where: { userId: user.id },
        loadEagerRelations: false,
        relations: { playlist: true, user: true },
      });
    }

    const data = Buffer.from(
      await lastValueFrom(
        this.formService.send<Buffer, PrintReportDeviceStatus>(
          MsvcFormService.ReportDeviceStatus,
          {
            user,
            monitors,
            format,
            dateFrom: new Date(dateFrom),
            dateTo: new Date(dateTo),
          },
        ),
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
        where: { userId: user.id, id: In(monitorIds) },
        loadEagerRelations: false,
        relations: { playlist: true, user: true, statistics: true },
      });
    } else {
      monitors = await this.monitorService.find({
        userId: user.id,
        where: { userId: user.id },
        loadEagerRelations: false,
        relations: { playlist: true, user: true, statistics: true },
      });
    }

    const data = Buffer.from(
      await lastValueFrom(
        this.formService.send<Buffer, PrintReportDeviceStatus>(
          MsvcFormService.ReportViews,
          {
            user,
            monitors,
            format,
            dateFrom: new Date(dateFrom),
            dateTo: new Date(dateTo),
          },
        ),
      ),
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
