import {
  Body,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ForbiddenError, NotFoundError } from '@/errors';
import {
  UserUpdateRequest,
  SuccessResponse,
  UsersGetResponse,
  UserGetResponse,
  UsersGetRequest,
} from '@/dto';
import { CRUD, UserRoleEnum, Status } from '@/enums';
import { paginationQuery } from '@/utils/pagination-query';
import { UserService } from '@/database/user.service';
import { ApiComplexDecorators, Crud } from '@/decorators';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserEntity } from '@/database/user.entity';
import { I18nPath } from '@/i18n';

@ApiComplexDecorators({ path: ['user'], roles: [UserRoleEnum.Administrator] })
export class UserController {
  logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    operationId: 'users-get',
    summary: 'Получение информации о пользователях (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UsersGetResponse,
  })
  @Crud(CRUD.READ)
  async users(
    @Body() { where: origWhere, select, scope }: UsersGetRequest,
  ): Promise<UsersGetResponse> {
    const where = TypeOrmFind.where(UserEntity, origWhere);
    const [data, count] = await this.userService.findAndCount({
      ...paginationQuery(scope),
      select,
      where,
    });

    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Patch('disable/:userId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'user-disable',
    summary: 'Отключение аккаунта пользователя (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  @Crud(CRUD.DELETE)
  async disableUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<SuccessResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ForbiddenError();
    }

    await this.userService.update(user, { disabled: true });

    return {
      status: Status.Success,
    };
  }

  @Patch('enable/:userId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'user-enable',
    summary: 'Открытие аккаунта пользователя (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  @Crud(CRUD.UPDATE)
  async enableUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<SuccessResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ForbiddenError();
    }

    await this.userService.update(user, { disabled: false });

    return {
      status: Status.Success,
    };
  }

  @Get(':userId')
  @ApiOperation({
    operationId: 'user-get',
    summary: 'Получение информации о пользователе (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserGetResponse,
  })
  @Crud(CRUD.READ)
  async user(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserGetResponse> {
    const data = await this.userService.findById(userId, {
      where: [{ disabled: true }, { disabled: false }],
    });
    if (!data) {
      throw new ForbiddenError();
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch(':userId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'user-update',
    summary: 'Изменение информации о пользователе (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserGetResponse,
  })
  @Crud(CRUD.UPDATE)
  async userUpdate(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() update: UserUpdateRequest,
  ): Promise<UserGetResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new ForbiddenError();
    }

    const data = await this.userService.update(user, update);
    if (!data) {
      throw new NotFoundError();
    }

    return {
      status: Status.Success,
      data,
    };
  }

  @Delete(':userId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'user-delete',
    summary: 'Удаление аккаунта пользователя (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  @Crud(CRUD.DELETE)
  async deleteUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<SuccessResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundError<I18nPath>('error.user.not_exist', {
        args: { id: userId },
      });
    }

    const { affected } = await this.userService.delete(user);
    if (!affected) {
      throw new NotFoundError<I18nPath>('error.user.not_exist', {
        args: { id: userId },
      });
    }

    return {
      status: Status.Success,
    };
  }
}
