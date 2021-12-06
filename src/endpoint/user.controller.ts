import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
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
  AuthResponse,
  Status,
  UserUpdateRequest,
  SuccessResponse,
  UsersResponse,
} from '@/dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@/guards';
import { UserRoleEnum } from '@/database/enums/role.enum';
import { UserService } from '@/database/user.service';
import { AuthService } from './auth/auth.service';

@ApiTags('user')
@ApiResponse({
  status: 400,
  description: 'Ответ будет таким если с регистрационным данным что-то не так',
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
    type: UserUpdateRequest,
  })
  async users(): Promise<UsersResponse> {
    return {
      status: Status.Success,
      data: await this.userService.findAll(false),
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
    type: UserUpdateRequest,
  })
  async user(@Param('userId') userId: string): Promise<AuthResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }

    return {
      status: Status.Success,
      data: user,
    };
  }

  @Post('/:userId')
  @ApiOperation({
    operationId: 'post_user__userId_',
    summary: 'Изменение информации о пользователе (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserUpdateRequest,
  })
  async userUpdate(
    @Param('userId') userId: string,
    @Body() update: UserUpdateRequest,
  ): Promise<AuthResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }

    return {
      status: Status.Success,
      data: await this.authService.update(user, update),
    };
  }

  @Delete('/disable/:userId')
  @ApiOperation({
    operationId: 'disable__userId_',
    summary: 'Скрытие аккаунта пользователя (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async disableUser(@Param('userId') userId: string): Promise<SuccessResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }

    await this.userService.update(user, { disabled: true });

    return {
      status: Status.Success,
    };
  }

  @Post('/enable/:userId')
  @ApiOperation({
    operationId: 'enable__userId_',
    summary: 'Открытие аккаунта пользователя (только администратор)',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async enableUser(@Param('userId') userId: string): Promise<SuccessResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }

    await this.userService.update(user, { disabled: false });

    return {
      status: Status.Success,
    };
  }

  @Delete('/delete/:userId')
  @ApiOperation({
    operationId: 'delete__userId_',
    summary: 'Удаление аккаунта пользователя (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async deleteUser(@Param('userId') userId: string): Promise<SuccessResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }

    await this.userService.delete(user);

    return {
      status: Status.Success,
    };
  }
}
