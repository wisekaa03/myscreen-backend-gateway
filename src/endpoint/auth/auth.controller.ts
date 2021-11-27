import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Request,
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
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ResetPasswordInvitationRequest,
  ResetPasswordVerifyRequest,
} from '@/dto/request';
import {
  RefreshTokenResponse,
  AuthResponse,
  SuccessResponse,
} from '@/dto/response';
import { PreconditionFailedError } from '@/dto/errors/precondition.response';
import { UnauthorizedError } from '@/dto/errors/unauthorized.reponse';
import { BadRequestError } from '@/dto/errors/bad-request.response';
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
  @ApiOperation({ summary: 'Проверяет, авторизован ли пользователь' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async authorization(@Request() req: ExpressRequest): Promise<AuthResponse> {
    const { user } = req;
    return this.authService.authorization(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async login(
    @Request() req: ExpressRequest,
    @Body() body: LoginRequest,
  ): Promise<AuthResponse> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;
    return this.authService.login(body, fingerprint);
  }

  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async register(
    @Request() req: ExpressRequest,
    @Body() body: RegisterRequest,
  ): Promise<AuthResponse> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;
    return this.authService.register(body, fingerprint);
  }

  @Post('/refresh')
  @ApiOperation({ summary: 'Обновление токена' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: RefreshTokenResponse,
  })
  async refresh(
    @Request() req: ExpressRequest,
    @Body() body: RefreshTokenRequest,
  ): Promise<RefreshTokenResponse> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;
    return this.authService.refresh(body, fingerprint);
  }

  @Post('/verify-email')
  @ApiOperation({ summary: 'Подтвердить email пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async verifyEmail(
    @Request() req: ExpressRequest,
    @Body() body: VerifyEmailRequest,
  ): Promise<SuccessResponse> {
    return this.authService.verifyEmail(body);
  }

  @Post('/reset-password')
  @ApiOperation({
    summary: 'Отправить на почту пользователю разрешение на смену пароля',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async resetPasswordInvitation(
    @Request() req: ExpressRequest,
    @Body() body: ResetPasswordInvitationRequest,
  ): Promise<SuccessResponse> {
    return this.authService.forgotPasswordInvitation(body);
  }

  @Post('/reset-password-verify')
  @ApiOperation({ summary: 'Меняет пароль пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async resetPasswordVerify(
    @Request() req: ExpressRequest,
    @Body() body: ResetPasswordVerifyRequest,
  ): Promise<SuccessResponse> {
    return this.authService.forgotPasswordVerify(body);
  }
}
