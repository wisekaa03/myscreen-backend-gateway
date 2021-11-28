import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AuthResponse,
  BadRequestError,
  ForbiddenError,
  Status,
  UnauthorizedError,
  UserUpdateRequest,
  SuccessResponse,
  UsersResponse,
} from '@/dto';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { UserRole } from '@/database/enums/role.enum';
import { UserService } from '@/database/user.service';
import { Roles } from '@/guards/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import { userEntityToUser } from '@/dto/user.dto';
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
      throw new BadRequestError();
    }
    return {
      status: Status.Success,
      data: userEntityToUser(await this.userService.findById(user?.id)),
    };
  }

  @Put('/:userId')
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
      throw new BadRequestError();
    }
    return this.userService.updateFromRequest(user, body);
  }

  @Delete('/disabled/:userId')
  @Roles(UserRole.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'disabled__userId_',
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
      throw new BadRequestError();
    }
    return this.authService.setUserDisabled(user);
  }

  @Delete('/enabled/:userId')
  @Roles(UserRole.Administrator)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'enabled__userId_',
    summary: 'Скрытие аккаунта пользователя (только администратор)',
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
      throw new BadRequestError();
    }
    return this.authService.setUserEnabled(user);
  }
}
