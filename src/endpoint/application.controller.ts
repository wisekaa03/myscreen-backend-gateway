import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { Not } from 'typeorm';

import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import {
  BadRequestError,
  ApplicationsGetRequest,
  ApplicationGetResponse,
  ApplicationsGetResponse,
  ApplicationUpdateRequest,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  SuccessResponse,
  UnauthorizedError,
} from '@/dto';
import { Controllers, CRUDS, Status, UserRoleEnum } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { WSGateway } from '@/websocket/ws.gateway';
import { UserService } from '@/database/user.service';
import { ApplicationService } from '@/database/application.service';

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
    private readonly userService: UserService,
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
  async getApplications(
    @Req() { user }: ExpressRequest,
    @Body() { where, select, scope }: ApplicationsGetRequest,
  ): Promise<ApplicationsGetResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.APPLICATION, CRUDS.READ, user);

    const sqlWhere = TypeOrmFind.Where(where);
    if (user.role === UserRoleEnum.MonitorOwner) {
      const [data, count] = await this.applicationService.findAndCount({
        ...paginationQueryToConfig(scope),
        select,
        where: [
          { ...sqlWhere, buyerId: Not(user.id) },
          { ...sqlWhere, sellerId: Not(user.id) },
        ],
      });

      return {
        status: Status.Success,
        count,
        data,
      };
    }

    if (user.role === UserRoleEnum.Advertiser) {
      const [data, count] = await this.applicationService.findAndCount({
        ...paginationQueryToConfig(scope),
        select,
        where: [
          { ...sqlWhere, buyerId: user.id },
          { ...sqlWhere, sellerId: user.id },
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
      select,
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
  async getApplication(
    @Req() { user }: ExpressRequest,
    @Param('applicationId', ParseUUIDPipe) id: string,
  ): Promise<ApplicationGetResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.APPLICATION, CRUDS.READ, user);

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
    @Req() { user }: ExpressRequest,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() update: ApplicationUpdateRequest,
  ): Promise<ApplicationGetResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.APPLICATION, CRUDS.UPDATE, user);

    const application = await this.applicationService.findOne({
      where: [
        {
          id: applicationId,
          sellerId: user.id,
        },
        {
          id: applicationId,
          buyerId: user.id,
        },
      ],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const data = await this.applicationService.update(applicationId, {
      ...application,
      ...update,
    });
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
    @Req() { user }: ExpressRequest,
    @Param('applicationId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    // Verify user to role and plan
    await this.userService.verify(Controllers.APPLICATION, CRUDS.DELETE, user);

    const application = await this.applicationService.findOne({
      where: [
        { id, sellerId: user.id },
        { id, buyerId: user.id },
      ],
      relations: ['monitor'],
    });
    if (!application) {
      throw new NotFoundException(`Application '${id}' is not found`);
    }

    const { affected } = await this.applicationService.delete(
      user.id,
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
