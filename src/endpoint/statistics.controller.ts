import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import {
  Body,
  Controller,
  forwardRef,
  Get,
  HttpCode,
  Inject,
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
  NotFoundError,
  ReportDeviceStatusRequest,
  ReportViewsRequest,
  ServiceUnavailableError,
  UnauthorizedError,
} from '../dto/index';
import { JwtAuthGuard, Roles, RolesGuard } from '../guards/index';
import { Status, UserRoleEnum } from '../enums/index';
import { InvoiceFormat } from '../enums/invoice-format.enum';
import { StatisticsResponse } from '../dto/response/statistics.response';
import { UserService } from '../database/user.service';
import { WSGateway } from '../websocket/ws.gateway';
import { PlaylistService } from '../database/playlist.service';
import { MonitorService } from '../database/monitor.service';
import { XlsxService } from '../xlsx/xlsx.service';

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
@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  logger = new Logger(StatisticsController.name);

  constructor(
    private readonly userService: UserService,
    private readonly monitorService: MonitorService,
    private readonly playlistService: PlaylistService,
    private readonly xlsxService: XlsxService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Get('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'statistics',
    summary: 'Получение статистики',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: StatisticsResponse,
  })
  async getPlaylists(
    @Req() { user: { id: userId } }: ExpressRequest,
  ): Promise<StatisticsResponse> {
    const [[, added], [, played], user] = await Promise.all([
      this.playlistService.findAndCount({
        where: { userId },
        relations: [],
      }),
      this.monitorService.findAndCount(userId, {
        where: { userId, playlistPlayed: true },
      }),
      this.userService.findById(userId),
    ]);

    return {
      status: Status.Success,
      countDevices: this.wsGateway.statistics(),
      playlists: { added, played },
      storageSpace: {
        used: user?.countUsedSpace ?? 0,
        unused: user?.storageSpace ?? 0,
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
  async reportDeviceStatus(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Body() { format, dateFrom, dateTo }: ReportDeviceStatusRequest,
  ): Promise<void> {
    if (format === InvoiceFormat.XLSX) {
      const data = await this.xlsxService.reportDeviceStatus({
        userId,
        dateFrom,
        dateTo,
      });

      res.statusCode = 200;
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="reportDeviceStatus.xlsx"',
      );
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.end(data, 'binary');
      return;
    }

    // if (format === InvoiceFormat.PDF) {
    // }

    throw new InternalServerErrorException();
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
  async reportViews(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Body() { format, dateFrom, dateTo }: ReportViewsRequest,
  ): Promise<void> {
    if (format === InvoiceFormat.XLSX) {
      const data = await this.xlsxService.reportViews({
        userId,
        dateFrom,
        dateTo,
      });

      res.statusCode = 200;
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="reportViews.xlsx"',
      );
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.end(data, 'binary');
      return;
    }

    // if (format === InvoiceFormat.PDF) {
    // }

    throw new InternalServerErrorException();
  }
}
