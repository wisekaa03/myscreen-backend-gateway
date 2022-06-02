import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
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

import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import {
  BadRequestError,
  CooperationGetRequest,
  CooperationsGetResponse,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from '@/dto';
import { Status, UserRoleEnum } from '@/enums';
import { CooperationService } from '@/database/cooperation.service';
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
  description: 'Ошибка папки',
  type: NotFoundError,
})
@ApiResponse({
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@Roles(
  UserRoleEnum.Administrator,
  UserRoleEnum.Advertiser,
  UserRoleEnum.MonitorOwner,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('cooperation')
@Controller('cooperation')
export class CooperationController {
  logger = new Logger(CooperationController.name);

  constructor(private readonly cooperationService: CooperationService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperations-get',
    summary: 'Получение списка взаимодествия',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: CooperationsGetResponse,
  })
  async getCooperations(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() { where, scope }: CooperationGetRequest,
  ): Promise<CooperationsGetResponse> {
    const [data, count] = await this.cooperationService.findAndCount({
      ...paginationQueryToConfig(scope),
      where: {
        userId,
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
