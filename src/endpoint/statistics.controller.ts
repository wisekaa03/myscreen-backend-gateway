import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  Body,
  forwardRef,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { In } from 'typeorm';

import {
  ReportDeviceStatusRequest,
  ReportViewsRequest,
  StatisticsResponse,
} from '@/dto';
import { Status, UserRoleEnum, SpecificFormat, CRUD } from '@/enums';
import { Crud, Standard } from '@/decorators';
import { formatToContentType } from '@/utils/format-to-content-type';
import { PrintService } from '@/print/print.service';
import { WSGateway } from '@/websocket/ws.gateway';
import { UserService } from '@/database/user.service';
import { PlaylistService } from '@/database/playlist.service';
import { MonitorService } from '@/database/monitor.service';
import { MonitorEntity } from '@/database/monitor.entity';
import { ApplicationService } from '@/database/application.service';

@Standard(
  'statistics',
  UserRoleEnum.Administrator,
  UserRoleEnum.Accountant,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
)
export class StatisticsController {
  logger = new Logger(StatisticsController.name);

  constructor(
    private readonly userService: UserService,
    private readonly monitorService: MonitorService,
    private readonly applicationService: ApplicationService,
    private readonly playlistService: PlaylistService,
    private readonly printService: PrintService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    operationId: 'statistics',
    summary: 'Получение общей статистики по пользователю',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: StatisticsResponse,
  })
  @Crud(CRUD.STATUS)
  async getPlaylists(
    @Req() { user }: ExpressRequest,
  ): Promise<StatisticsResponse> {
    const [[, added], [, played]] = await Promise.all([
      this.playlistService.findAndCount({
        where: { userId: user.id },
        relations: [],
      }),
      this.monitorService.findAndCount(user.id, {
        where: { userId: user.id, playlistPlayed: true },
      }),
    ]);

    return {
      status: Status.Success,
      playlists: { added, played },
      countDevices: this.wsGateway.statistics(),
      monitors: await this.applicationService.statistics(user),
      storageSpace: {
        used: user?.countUsedSpace ?? 0,
        total: user?.storageSpace ?? 0,
      },
    };
  }

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
    @Body() { format, monitorsId, dateFrom, dateTo }: ReportDeviceStatusRequest,
  ): Promise<void> {
    let monitors: MonitorEntity[] | undefined;
    if (Array.isArray(monitorsId) && monitorsId.length > 0) {
      monitors = await this.monitorService.find(user.id, {
        where: { userId: user.id, id: In(monitorsId) },
      });
    }

    const data = await this.printService.reportDeviceStatus({
      user,
      monitors,
      format,
      dateFrom,
      dateTo,
    });

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
    @Body() { format, monitorsId, dateFrom, dateTo }: ReportViewsRequest,
  ): Promise<void> {
    let monitors: MonitorEntity[] | undefined;
    if (Array.isArray(monitorsId) && monitorsId.length > 0) {
      monitors = await this.monitorService.find(user.id, {
        where: { userId: user.id, id: In(monitorsId) },
      });
    }

    const data = await this.printService.reportViews({
      user,
      monitors,
      format,
      dateFrom,
      dateTo,
    });

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
