import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
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
    operationId: 'auth',
    summary:
      'Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async authorization(@Req() req: ExpressRequest): Promise<AuthResponse> {
    const { user } = req;

    return {
      status: Status.Success,
      data: userEntityToUser(user),
    };
  }

  @Post('/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'update',
    summary: 'Изменение аккаунта пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: UserResponse,
  })
  async update(
    @Req() req: ExpressRequest,
    @Body() update: UserUpdateRequest,
  ): Promise<UserResponse> {
    const { user } = req;
    if (!user) {
      throw new BadRequestException();
    }
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
  async register(
    @Req() req: ExpressRequest,
    @Body() body: RegisterRequest,
  ): Promise<AuthResponse> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;

    return this.authService.register(body, fingerprint);
  }

  @Get('/ping')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'ping', summary: 'Проверка токена' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async ping(): Promise<SuccessResponse> {
    return { status: Status.Success };
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

  @Post('/verify-email')
  @ApiOperation({
    operationId: 'verify-email',
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
