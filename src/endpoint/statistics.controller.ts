import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { Body, HttpCode, Inject, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { MsvcFormReportDeviceStatus, MsvcFormReportViews } from '@/interfaces';
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
import { MonitorStatisticsEntity } from '@/database/monitor-statistics.entity';

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
    @Inject(MICROSERVICE_MYSCREEN.FORM)
    private readonly formService: ClientProxy,
  ) {}

  @Post('device-status')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'device-status',
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
    let monitors: MonitorEntity[];
    if (Array.isArray(monitorIds) && monitorIds.length > 0) {
      monitors = await this.monitorService.find({
        userId: user.id,
        where: {
          userId:
            user.role === UserRoleEnum.Administrator ? undefined : user.id,
          id: In(monitorIds),
        },
        loadEagerRelations: false,
        relations: { monitorOnline: true, user: true },
      });
    } else {
      monitors = await this.monitorService.find({
        userId: user.id,
        where: {
          userId:
            user.role === UserRoleEnum.Administrator ? undefined : user.id,
        },
        loadEagerRelations: false,
        relations: { monitorOnline: true, user: true },
      });
    }

    const data = Buffer.from(
      await lastValueFrom(
        this.formService
          .send<Buffer, MsvcFormReportDeviceStatus>(
            MsvcFormService.ReportDeviceStatus,
            {
              user,
              monitors,
              format,
              dateFrom: new Date(dateFrom),
              dateTo: new Date(dateTo),
            },
          )
          .pipe(timeout(3000)),
      ),
    );

    const specificFormat = formatToContentType[format]
      ? format
      : SpecificFormat.XLSX;

    res.statusCode = 200;
    res.set({
      'Content-Type': formatToContentType[format],
      'Content-Disposition': `attachment; filename="report-device-status.${specificFormat}"`,
    });

    res.end(data, 'binary');
  }

  @Post('report-views')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'report-views',
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
    const { id: userId, role } = user;
    let statistics: MonitorStatisticsEntity[];
    if (Array.isArray(monitorIds) && monitorIds.length > 0) {
      statistics = await this.monitorService.findStatistics({
        where: {
          userId: role === UserRoleEnum.Administrator ? undefined : userId,
          monitorId: In(monitorIds),
        },
        loadEagerRelations: true,
        relations: { user: true, monitor: true, playlist: true },
      });
    } else {
      statistics = await this.monitorService.findStatistics({
        where: {
          userId: role === UserRoleEnum.Administrator ? undefined : userId,
        },
        loadEagerRelations: true,
        relations: { user: true, monitor: true, playlist: true },
      });
    }

    const data = Buffer.from(
      await lastValueFrom(
        this.formService
          .send<Buffer, MsvcFormReportViews>(MsvcFormService.ReportViews, {
            user,
            statistics,
            format,
            dateFrom: new Date(dateFrom),
            dateTo: new Date(dateTo),
          })
          .pipe(timeout(3000)),
      ),
    );

    const specificFormat = formatToContentType[format]
      ? format
      : SpecificFormat.XLSX;

    res.statusCode = 200;
    res.set({
      'Content-Type': formatToContentType[format],
      'Content-Disposition': `attachment; filename="report-views.${specificFormat}"`,
    });

    res.end(data, 'binary');
  }
}
