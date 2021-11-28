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
  AuthResponse,
  Status,
  UnauthorizedError,
  UserUpdateRequest,
  SuccessResponse,
  UsersResponse,
  userEntityToUser,
} from '@/dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@/guards';
import { UserRole } from '@/database/enums/role.enum';
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
@Controller('user')
export class UserController {
  logger = new Logger(UserController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('/')
  @Roles(UserRole.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'user',
    summary: 'Получение информации о пользователях (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserUpdateRequest,
  })
  async userGetAll(): Promise<UsersResponse> {
    return {
      status: Status.Success,
      data: await this.userService.findAll(false),
    };
  }

  @Get('/:userId')
  @Roles(UserRole.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'user__userId_',
    summary: 'Получение информации о пользователе (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserUpdateRequest,
  })
  async userGet(@Param('userId') userId: string): Promise<AuthResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }
    return {
      status: Status.Success,
      data: userEntityToUser(await this.userService.findById(user?.id)),
    };
  }

  @Post('/:userId')
  @Roles(UserRole.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'user__userId_',
    summary: 'Изменение информации о пользователе (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserUpdateRequest,
  })
  async userUpdate(
    @Param('userId') userId: string,
    @Body() body: UserUpdateRequest,
  ): Promise<AuthResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }
    return this.userService.updateFromRequest(user, body);
  }

  @Delete('/disable/:userId')
  @Roles(UserRole.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'disable__userId_',
    summary: 'Скрытие аккаунта пользователя (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async disabledUserAdmin(
    @Param('userId') userId: string,
  ): Promise<SuccessResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }
    return this.authService.setUserDisabled(user);
  }

  @Post('/enable/:userId')
  @Roles(UserRole.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'enable__userId_',
    summary: 'Открытие аккаунта пользователя (только администратор)',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async enableUserAdmin(
    @Param('userId') userId: string,
  ): Promise<SuccessResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException();
    }
    return this.authService.setUserEnabled(user);
  }
}
