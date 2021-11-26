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
import { Request as ExpressRequest } from 'express';

import { PreconditionFailedError } from '@/dto/errors/precondition.response';
import { UnauthorizedError } from '@/dto/errors/unauthorized.reponse';
import { BadRequestError } from '@/dto/errors/bad-request.response';

import { AuthResponseDto } from '@/dto/response/authentication.response';
import { RefreshTokenRequestDto } from '@/dto/request/refresh-token.request';
import { RefreshTokenResponseDto } from '@/dto/response/refresh.response';
import { LoginRequestDto } from '@/dto/request/login.request';
import { RegisterRequestDto } from '@/dto/request/register.request';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';

import { AuthService } from './auth.service';
import { VerifyEmailRequestDto } from '../dto/request/verify-email.request';
import { SuccessResponseDto } from '../dto/response/success.response';

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
    type: AuthResponseDto,
  })
  async authorization(
    @Request() req: ExpressRequest,
  ): Promise<AuthResponseDto> {
    const { user } = req;
    return this.authService.authorization(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponseDto,
  })
  async login(
    @Request() req: ExpressRequest,
    @Body() body: LoginRequestDto,
  ): Promise<AuthResponseDto> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;
    return this.authService.login(body, fingerprint);
  }

  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponseDto,
  })
  async register(
    @Request() req: ExpressRequest,
    @Body() body: RegisterRequestDto,
  ): Promise<AuthResponseDto> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;
    return this.authService.register(body, fingerprint);
  }

  @Post('/refresh')
  @ApiOperation({ summary: 'Обновление токена' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponseDto,
  })
  async refresh(
    @Request() req: ExpressRequest,
    @Body() body: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;
    return this.authService.refresh(body, fingerprint);
  }

  @Post('/verify-email')
  @ApiOperation({ summary: 'Подтвердить email пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponseDto,
  })
  async verifyEmail(
    @Request() req: ExpressRequest,
    @Body() body: VerifyEmailRequestDto,
  ): Promise<SuccessResponseDto> {
    return this.authService.verifyEmail(body);
  }
}
