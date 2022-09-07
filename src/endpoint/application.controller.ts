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
import { In, Not } from 'typeorm';

import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import {
  BadRequestError,
  ApplicationGetRequest,
  ApplicationGetResponse,
  ApplicationsGetResponse,
  ApplicationUpdateRequest,
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
@ApiTags('application')
@Controller('application')
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
    operationId: 'applications-get',
    summary: 'Получение списка заявок',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationsGetResponse,
  })
  async getCooperations(
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Body() { where, scope }: ApplicationGetRequest,
  ): Promise<ApplicationsGetResponse> {
    const sqlWhere = TypeOrmFind.Where(where);
    if (role.includes(UserRoleEnum.MonitorOwner)) {
      const [data, count] = await this.applicationService.findAndCount({
        ...paginationQueryToConfig(scope),
        where: [
          { ...sqlWhere, buyerId: Not(userId) },
          { ...sqlWhere, sellerId: Not(userId) },
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
          { ...sqlWhere, buyerId: userId },
          { ...sqlWhere, sellerId: userId },
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
    operationId: 'application-get',
    summary: 'Получение заявки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationGetResponse,
  })
  async getEditor(
    @Param('applicationId', ParseUUIDPipe) id: string,
  ): Promise<ApplicationGetResponse> {
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
    operationId: 'application-update',
    summary: 'Изменить заявку',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: ApplicationGetResponse,
  })
  async updateApplication(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('applicationId', ParseUUIDPipe) id: string,
    @Body() update: ApplicationUpdateRequest,
  ): Promise<ApplicationGetResponse> {
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
    operationId: 'application-delete',
    summary: 'Удаление заявки',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteApplication(
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
