import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
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
import type { Request as ExpressRequest } from 'express';

import {
  PreconditionFailedError,
  UnauthorizedError,
  BadRequestError,
  InternalServerError,
  LoginRequest,
  UserUpdateRequest,
  RefreshTokenRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ResetPasswordInvitationRequest,
  ResetPasswordVerifyRequest,
  RefreshTokenResponse,
  AuthResponse,
  SuccessResponse,
  Status,
  userEntityToUser,
  UserResponse,
} from '@/dto';
import { UserService } from '@/database/user.service';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

import { AuthService } from './auth.service';

@ApiTags('auth')
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
  status: 412,
  description: 'Пользователь уже существует',
  type: PreconditionFailedError,
})
@ApiResponse({
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@Controller('auth')
export class AuthController {
  logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'get_auth',
    summary:
      'Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async authorization(@Req() { user }: ExpressRequest): Promise<AuthResponse> {
    return {
      status: Status.Success,
      data: userEntityToUser(user),
    };
  }

  @Put('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'update_auth',
    summary: 'Изменение аккаунта пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: UserResponse,
  })
  async update(
    @Req() { user }: ExpressRequest,
    @Body() update: UserUpdateRequest,
  ): Promise<UserResponse> {
    const data = await this.authService.update(user, update);
    return {
      status: Status.Success,
      data: userEntityToUser(data),
    };
  }

  @Post('login')
  @ApiOperation({ operationId: 'login', summary: 'Авторизация пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async login(
    @Req() req: ExpressRequest,
    @Body() body: LoginRequest,
  ): Promise<AuthResponse> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;

    return this.authService.login(body, fingerprint);
  }

  @Post('register')
  @ApiOperation({
    operationId: 'register',
    summary: 'Регистрация пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async register(@Body() body: RegisterRequest): Promise<AuthResponse> {
    return this.authService.register(body);
  }

  @Post('/refresh')
  @ApiOperation({ operationId: 'refresh', summary: 'Обновление токена' })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: RefreshTokenResponse,
  })
  async refresh(
    @Req() req: ExpressRequest,
    @Body() body: RefreshTokenRequest,
  ): Promise<RefreshTokenResponse> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;

    return this.authService.refresh(body, fingerprint);
  }

  @Post('/email-verify')
  @ApiOperation({
    operationId: 'email-verify',
    summary: 'Подтвердить email пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async verifyEmail(
    @Body() body: VerifyEmailRequest,
  ): Promise<SuccessResponse> {
    return this.authService.verifyEmail(body);
  }

  @Post('/reset-password')
  @ApiOperation({
    operationId: 'reset-password',
    summary: 'Отправить на почту пользователю разрешение на смену пароля',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async resetPasswordInvitation(
    @Body() body: ResetPasswordInvitationRequest,
  ): Promise<SuccessResponse> {
    return this.authService.forgotPasswordInvitation(body);
  }

  @Post('/reset-password-verify')
  @ApiOperation({
    operationId: 'reset-password-verify',
    summary: 'Меняет пароль пользователя по приглашению из почты',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async resetPasswordVerify(
    @Body() body: ResetPasswordVerifyRequest,
  ): Promise<SuccessResponse> {
    return this.authService.forgotPasswordVerify(body);
  }

  @Delete('/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'disable',
    summary: 'Скрытие аккаунта пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async disableUser(@Req() req: ExpressRequest): Promise<SuccessResponse> {
    const { user } = req;
    if (!user) {
      throw new BadRequestException();
    }

    await this.userService.update(user, { disabled: true });

    return {
      status: Status.Success,
    };
  }
}
