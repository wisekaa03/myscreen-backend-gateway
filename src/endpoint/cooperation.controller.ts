import type { Request as ExpressRequest } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { Status, UserRoleEnum } from '@/enums';
import { CooperationService } from '@/database/cooperation.service';
import { paginationQueryToConfig } from '@/shared/pagination-query-to-config';
import { TypeOrmFind } from '@/shared/typeorm.find';

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
    operationId: 'get-many',
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
    operationId: 'create',
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
    const data = await this.cooperationService.update(userId, body);
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
    operationId: 'get-one',
    summary: 'Получение взаимодействия',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: CooperationGetResponse,
  })
  async getEditor(
    @Req() { user: { id: userId } }: ExpressRequest,
    @Param('cooperationId', ParseUUIDPipe) id: string,
  ): Promise<CooperationGetResponse> {
    const data = await this.cooperationService.findOne({
      where: {
        userId,
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
    operationId: 'update',
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
    const editor = await this.cooperationService.findOne({
      where: {
        userId,
        id,
      },
    });
    if (!editor) {
      throw new NotFoundException('Cooperation not found');
    }

    const data = await this.cooperationService.update(userId, {
      ...editor,
      ...update,
    });
    if (!data) {
      throw new BadRequestException('Cooperation exists and not exists ?');
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete('/:cooperationId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'delete',
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
      where: { userId, id },
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
