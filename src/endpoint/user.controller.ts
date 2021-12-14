import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  UnauthorizedException,
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
  Status,
  UserUpdateRequest,
  SuccessResponse,
  UsersResponse,
  UserResponse,
} from '@/dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@/guards';
import { UserRoleEnum } from '@/database/enums/role.enum';
import { UserService } from '@/database/user.service';
import { AuthService } from './auth/auth.service';

@ApiTags('user')
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
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@Roles(UserRoleEnum.Administrator)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('user')
export class UserController {
  logger = new Logger(UserController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('/')
  @ApiOperation({
    operationId: 'user',
    summary: 'Получение информации о пользователях (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UsersResponse,
  })
  async users(): Promise<UsersResponse> {
    return {
      status: Status.Success,
      data: await this.userService
        .findAll(false)
        .then((user) => user.map(({ password, ...data }) => data)),
    };
  }

  @Get('/:userId')
  @ApiOperation({
    operationId: 'user__userId_',
    summary: 'Получение информации о пользователе (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserResponse,
  })
  async user(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
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
    operationId: 'post_user__userId_',
    summary: 'Изменение информации о пользователе (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserResponse,
  })
  async userUpdate(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() update: UserUpdateRequest,
  ): Promise<UserResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      status: Status.Success,
      data: await this.userService
        .update(user, update)
        .then(({ password, ...data }) => data),
    };
  }

  @Patch('/disable/:userId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'disable__userId_',
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
      throw new UnauthorizedException();
    }

    await this.userService.update(user, { disabled: true });

    return {
      status: Status.Success,
    };
  }

  @Patch('/enable/:userId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'enable__userId_',
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
      throw new UnauthorizedException();
    }

    await this.userService.update(user, { disabled: false });

    return {
      status: Status.Success,
    };
  }

  @Delete('/:userId')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'delete__userId_',
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
      throw new UnauthorizedException();
    }

    await this.userService.delete(user);

    return {
      status: Status.Success,
    };
  }
}
