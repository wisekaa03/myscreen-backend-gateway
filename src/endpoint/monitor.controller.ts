import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
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
  MonitorCreateResponse,
  MonitorRequest,
  MonitorsGetRequest,
  MonitorsGetResponse,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { Status } from '@/enums/status.enum';
import { MonitorService } from '@/database/monitor.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';

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
  description: 'Ошибка монитора',
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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('monitor')
@Controller('monitor')
export class MonitorController {
  logger = new Logger(MonitorController.name);

  constructor(private readonly monitorService: MonitorService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitors-get',
    summary: 'Получение списка мониторов',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorsGetResponse,
  })
  async getMonitors(
    @Req() { user }: ExpressRequest,
    @Body() { where, scope }: MonitorsGetRequest,
  ): Promise<MonitorsGetResponse> {
    const [data, count] = await this.monitorService.find({
      ...paginationQueryToConfig(scope),
      where: {
        userId: user.id,
        ...where,
      },
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Post('/create')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitor-create',
    summary: 'Создание монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: MonitorCreateResponse,
  })
  async createMonitors(
    @Req() { user }: ExpressRequest,
    @Body() monitor: MonitorRequest,
  ): Promise<MonitorCreateResponse> {
    const data = await this.monitorService.create(user, monitor).catch(() => {
      throw new BadRequestException(`Монитор '${monitor.name}' уже существует`);
    });

    return {
      status: Status.Success,
      data,
    };
  }
}
