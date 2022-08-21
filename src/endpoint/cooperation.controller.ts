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

import { In } from 'typeorm';
import { JwtAuthGuard, Roles, RolesGuard } from '@/guards';
import {
  BadRequestError,
  CooperationCreateRequest,
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
import { CooperationApproved, Status, UserRoleEnum } from '@/enums';
import { CooperationService } from '@/database/cooperation.service';
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
export class CooperationController {
  logger = new Logger(CooperationController.name);

  constructor(
    private readonly cooperationService: CooperationService,
    @Inject(forwardRef(() => WSGateway))
    private readonly wsGateway: WSGateway,
  ) {}

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
    @Req() { user: { id: userId, role } }: ExpressRequest,
    @Body() { where, scope }: CooperationGetRequest,
  ): Promise<CooperationsGetResponse> {
    const sqlWhere = TypeOrmFind.Where(where);
    if (role.includes(UserRoleEnum.MonitorOwner)) {
      const [data, count] = await this.cooperationService.findAndCount({
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
    if (role.includes(UserRoleEnum.Advertiser)) {
      const [data, count] = await this.cooperationService.findAndCount({
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

    const [data, count] = await this.cooperationService.findAndCount({
      ...paginationQueryToConfig(scope),
      where: TypeOrmFind.Where(where),
    });
    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Put('/')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperation-create',
    summary: 'Создание взаимодействия',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: CooperationGetResponse,
  })
  async createEditor(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() body: CooperationCreateRequest,
  ): Promise<CooperationGetResponse> {
    const data = await this.cooperationService.update(undefined, {
      ...body,
      sellerId: userId,
      userId,
    });
    if (!data) {
      throw new NotFoundException('Cooperation not found');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Get('/:cooperationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperation-get',
    summary: 'Получение взаимодействия',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: CooperationGetResponse,
  })
  async getEditor(
    @Param('cooperationId', ParseUUIDPipe) id: string,
  ): Promise<CooperationGetResponse> {
    const data = await this.cooperationService.findOne({
      where: {
        id,
      },
    });
    if (!data) {
      throw new NotFoundException('Cooperation not found');
    }
    return {
      status: Status.Success,
      data,
    };
  }

  @Patch('/:cooperationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperation-update',
    summary: 'Изменить взаимодействие',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: CooperationGetResponse,
  })
  async updateEditor(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('cooperationId', ParseUUIDPipe) id: string,
    @Body() update: CooperationUpdateRequest,
  ): Promise<CooperationGetResponse> {
    const application = await this.cooperationService.findOne({
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
      throw new NotFoundException('Cooperation not found');
    }

    const data = await this.cooperationService.update(id, {
      ...application,
      ...update,
    });
    if (!data) {
      throw new BadRequestException('Cooperation exists and not exists ?');
    }

    const { monitor, playlist } = application;
    if (data.approved === CooperationApproved.Allowed) {
      /* await */ this.wsGateway.monitorPlaylist(monitor, playlist);
    } else {
      /* await */ this.wsGateway.monitorPlaylist(monitor, null);
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete('/:cooperationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'cooperation-delete',
    summary: 'Удаление взаимодействия',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteCooperation(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('cooperationId', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse> {
    const cooperation = await this.cooperationService.findOne({
      where: [
        { id, sellerId: userId },
        { id, buyerId: userId },
      ],
      select: ['id', 'userId'],
    });
    if (!cooperation) {
      throw new NotFoundException(`Cooperation '${id}' is not found`);
    }

    const { affected } = await this.cooperationService.delete(
      userId,
      cooperation,
    );
    if (!affected) {
      throw new NotFoundException('This cooperation is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
