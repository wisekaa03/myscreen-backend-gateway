import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  HttpCode,
  Inject,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Not } from 'typeorm';

import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import {
  BadRequestError,
  CooperationGetRequest,
  CooperationGetResponse,
  CooperationsGetResponse,
  CooperationUpdateRequest,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  SuccessResponse,
  UnauthorizedError,
} from '@/dto';
import { Status, UserRoleEnum } from '@/enums';
import { ApplicationService } from '@/database/application.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { TypeOrmFind } from '@/shared/typeorm.find';
import { WSGateway } from '@/websocket/ws.gateway';

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
export class ApplicationController {
  logger = new Logger(ApplicationController.name);

  constructor(
    private readonly applicationService: ApplicationService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperations-get',
    summary: 'Получение списка заявок',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: CooperationsGetResponse,
  })
  async getCooperations(
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Body() { where, scope }: CooperationGetRequest,
  ): Promise<CooperationsGetResponse> {
    const sqlWhere = TypeOrmFind.Where(where);
    if (role.includes(UserRoleEnum.MonitorOwner)) {
      const [data, count] = await this.applicationService.findAndCount({
        ...paginationQueryToConfig(scope),
        where: [
          { ...sqlWhere, buyerId: userId, sellerId: Not(userId) },
          { ...sqlWhere, buyerId: Not(userId), sellerId: userId },
        ],
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    if (role.includes(UserRoleEnum.Advertiser)) {
      const [data, count] = await this.applicationService.findAndCount({
        ...paginationQueryToConfig(scope),
        where: [
          { ...sqlWhere, buyerId: userId, sellerId: Not(userId) },
          { ...sqlWhere, buyerId: Not(userId), sellerId: userId },
        ],
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    const [data, count] = await this.applicationService.findAndCount({
      ...paginationQueryToConfig(scope),
      where: TypeOrmFind.Where(where),
    });
    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Get('/:applicationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperation-get',
    summary: 'Получение заявки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: CooperationGetResponse,
  })
  async getEditor(
    @Param('applicationId', ParseUUIDPipe) id: string,
  ): Promise<CooperationGetResponse> {
    const data = await this.applicationService.findOne({
      where: {
        id,
      },
    });
    if (!data) {
      throw new NotFoundException('Application not found');
    }
    return {
      status: Status.Success,
      data,
    };
  }

  @Patch('/:applicationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperation-update',
    summary: 'Изменить заявку',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: CooperationGetResponse,
  })
  async updateEditor(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('applicationId', ParseUUIDPipe) id: string,
    @Body() update: CooperationUpdateRequest,
  ): Promise<CooperationGetResponse> {
    const application = await this.applicationService.findOne({
      where: [
        {
          id,
          sellerId: userId,
        },
        {
          id,
          buyerId: userId,
        },
      ],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const data = await this.applicationService.update(
      id,
      Object.assign(application, update),
    );
    if (!data) {
      throw new BadRequestException('Application exists and not exists ?');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete('/:applicationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperation-delete',
    summary: 'Удаление заявки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteCooperation(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('applicationId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const application = await this.applicationService.findOne({
      where: [
        { id, sellerId: userId },
        { id, buyerId: userId },
      ],
      select: ['id', 'sellerId', 'buyerId', 'userId'],
    });
    if (!application) {
      throw new NotFoundException(`Application '${id}' is not found`);
    }

    const { affected } = await this.applicationService.delete(
      userId,
      application,
    );
    if (!affected) {
      throw new NotFoundException('This application is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
