import {
  BadRequestException,
  Body,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import {
  UserUpdateRequest,
  SuccessResponse,
  UsersGetResponse,
  UserGetResponse,
  UsersGetRequest,
} from '@/dto';
import { CRUD, UserRoleEnum, Status } from '@/enums';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';
import { UserService } from '@/database/user.service';
import { Crud, Standard } from '@/decorators';

@Standard('user', [UserRoleEnum.Administrator])
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
    @Body() { where, select, scope }: UsersGetRequest,
  ): Promise<UsersGetResponse> {
    const [users, count] = await this.userService.findAndCount({
      ...paginationQueryToConfig(scope),
      select,
      where,
    });
    const data = users.map((user) => UserService.userEntityToUser(user));
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
    summary: 'Скрытие аккаунта пользователя (только администратор)',
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
      throw new ForbiddenException();
    }

    await this.userService.update(user.id, { disabled: true });

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
      throw new ForbiddenException();
    }

    await this.userService.update(user.id, { disabled: false });

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
    const user = await this.userService.findById(userId, [], true);
    if (!user) {
      throw new ForbiddenException();
    }
    const { password, ...data } = user;

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
      throw new ForbiddenException();
    }

    const data = await this.userService.update(user.id, update);
    if (!data) {
      throw new NotFoundException();
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
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('This user is not exists');
    }

    const { affected } = await this.userService.delete(user);
    if (!affected) {
      throw new NotFoundException('This user is not exists');
    }

    return {
      status: Status.Success,
    };
  }
}
