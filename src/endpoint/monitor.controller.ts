import type { Request as ExpressRequest } from 'express';
import {
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
  MonitorsGetRequest,
  MonitorsGetResponse,
  NotFoundError,
  ServiceUnavailableError,
  Status,
  UnauthorizedError,
} from '@/dto';
import { JwtAuthGuard } from '@/guards';
import { MonitorService } from '@/database/monitor.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';

@ApiTags('monitor')
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
@Controller('/monitor')
export class MonitorController {
  logger = new Logger(MonitorController.name);

  constructor(private readonly monitorService: MonitorService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'monitors_get',
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
}
