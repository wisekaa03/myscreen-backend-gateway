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
  HttpStatus,
  Inject,
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
  StatisticsResponse,
} from '@/dto';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import { Status, UserRoleEnum, SpecificFormat } from '@/enums';
import { UserService } from '@/database/user.service';
import { WSGateway } from '@/websocket/ws.gateway';
import { PlaylistService } from '@/database/playlist.service';
import { MonitorService } from '@/database/monitor.service';
import { PrintService } from '@/print/print.service';
import { formatToContentType } from '@/utils/format-to-content-type';

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
  status: HttpStatus.INTERNAL_SERVER_ERROR,
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
    private readonly printService: PrintService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Get('/')
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
  async reportDeviceStatus(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Body() { format, dateFrom, dateTo }: ReportDeviceStatusRequest,
  ): Promise<void> {
    const data = await this.printService.reportDeviceStatus({
      userId,
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
  async reportViews(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Res() res: ExpressResponse,
    @Body() { format, dateFrom, dateTo }: ReportViewsRequest,
  ): Promise<void> {
    const data = await this.printService.reportViews({
      userId,
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
