import {
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
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ResetPasswordInvitationRequest,
  ResetPasswordVerifyRequest,
  RefreshTokenResponse,
  AuthResponse,
  SuccessResponse,
  Status,
} from '@/dto';
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
@Controller('auth')
export class AuthController {
  logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

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
    return this.authService.authorization(user);
  }

  @Post('login')
  @ApiOperation({ operationId: 'login', summary: 'Авторизация пользователя' })
  @ApiResponse({
    status: 200,
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
    status: 200,
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
    status: 200,
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
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async verifyEmail(
    @Req() req: ExpressRequest,
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
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async resetPasswordInvitation(
    @Req() req: ExpressRequest,
    @Body() body: ResetPasswordInvitationRequest,
  ): Promise<SuccessResponse> {
    return this.authService.forgotPasswordInvitation(body);
  }

  @Post('/reset-password-verify')
  @ApiOperation({
    operationId: 'reset-password-verify',
    summary: 'Меняет пароль пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async resetPasswordVerify(
    @Req() req: ExpressRequest,
    @Body() body: ResetPasswordVerifyRequest,
  ): Promise<SuccessResponse> {
    return this.authService.forgotPasswordVerify(body);
  }

  @Delete('/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'disable',
    summary: 'Удаление аккаунта пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async disabledUser(@Req() req: ExpressRequest): Promise<SuccessResponse> {
    const { user } = req;
    return this.authService.setUserDisabled(user);
  }
}
