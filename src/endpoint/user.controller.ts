import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
  UnauthorizedError,
  InternalServerError,
  UserUpdateRequest,
  SuccessResponse,
  UsersGetResponse,
  UserGetResponse,
  UsersGetRequest,
  NotFoundError,
} from '@/dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@/guards';
import { Status } from '@/enums/status.enum';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { UserService } from '@/database/user.service';
import { paginationQueryToConfig } from '@/utils/pagination-query-to-config';

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
@Roles(UserRoleEnum.Administrator)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('user')
@Controller('user')
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
  async users(
    @Body() { where, select, scope }: UsersGetRequest,
  ): Promise<UsersGetResponse> {
    const [users, count] = await this.userService.findAndCount({
      ...paginationQueryToConfig(scope),
      select,
      where,
    });
    const data = users.map(
      ({ password, forgotConfirmKey, emailConfirmKey, ...entity }) => entity,
    );
    return {
      status: Status.Success,
      count,
      data,
    };
  }

  @Patch('/disable/:userId')
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

  @Patch('/enable/:userId')
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

  @Get('/:userId')
  @ApiOperation({
    operationId: 'user-get',
    summary: 'Получение информации о пользователе (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserGetResponse,
  })
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

  @Patch('/:userId')
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

  @Delete('/:userId')
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
