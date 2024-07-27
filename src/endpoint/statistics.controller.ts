import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { Body, HttpCode, Inject, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { In } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import { MsvcFormReport } from '@/interfaces';
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
    let monitors: MonitorEntity[] | undefined;
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
        this.formService.send<Buffer, MsvcFormReport>(
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
    let monitors: MonitorEntity[] | undefined;
    if (Array.isArray(monitorIds) && monitorIds.length > 0) {
      monitors = await this.monitorService.find({
        userId: user.id,
        where: {
          userId:
            user.role === UserRoleEnum.Administrator ? undefined : user.id,
          id: In(monitorIds),
        },
        loadEagerRelations: false,
        relations: { user: true, statistics: true },
      });
    } else {
      monitors = await this.monitorService.find({
        userId: user.role === UserRoleEnum.Administrator ? undefined : user.id,
        where: { userId: user.id },
        loadEagerRelations: false,
        relations: { user: true, statistics: true },
      });
    }

    const data = Buffer.from(
      await lastValueFrom(
        this.formService.send<Buffer, MsvcFormReport>(
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
    res.set({
      'Content-Type': formatToContentType[format],
      'Content-Disposition': `attachment; filename="report-views.${specificFormat}"`,
    });

    res.end(data, 'binary');
  }
}
