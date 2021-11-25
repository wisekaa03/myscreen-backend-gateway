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
import { validate } from 'class-validator';
import { Request as ExpressRequest } from 'express';

import {
  AuthResponseDto,
  RefreshTokenResponseDto,
} from '@/dto/response/auth.response';
import { RefreshTokenRequestDto } from '@/dto/request/refresh-token.request';
import { LoginRequestDto } from '@/dto/request/login.request';
import { RegisterRequestDto } from '@/dto/request/register.request';

import { UnauthorizedErrorResponse } from '@/endpoint/dto/response/unauthorized.reponse';
import { AuthService } from './auth.service';
import { PreconditionFailedErrorResponse } from '@/dto/response/precondition.response';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
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
  @ApiResponse({
    status: 401,
    description: 'Ответ для неавторизованных пользователей',
    type: UnauthorizedErrorResponse,
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
  @ApiResponse({
    status: 401,
    description: 'Ответ для неавторизованных пользователей',
    type: UnauthorizedErrorResponse,
  })
  @ApiResponse({
    status: 412,
    description:
      'Ответ будет таким если с регистрационным данным что-то не так',
    type: PreconditionFailedErrorResponse,
  })
  async login(
    @Request() req: ExpressRequest,
    @Body() body: LoginRequestDto,
  ): Promise<AuthResponseDto> {
    const login = await validate(body);
    if (Object.keys(login).length > 0) {
      throw new PreconditionFailedErrorResponse();
    }
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
  @ApiResponse({
    status: 401,
    description: 'Ответ для незарегистрированного пользователя',
    type: UnauthorizedErrorResponse,
  })
  @ApiResponse({
    status: 412,
    description:
      'Ответ будет таким если с регистрационным данным что-то не так',
    type: PreconditionFailedErrorResponse,
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
  @ApiResponse({
    status: 401,
    description: 'Ответ для незарегистрированного пользователя',
    type: UnauthorizedErrorResponse,
  })
  @ApiResponse({
    status: 412,
    description:
      'Ответ будет таким если с регистрационным данным что-то не так',
    type: PreconditionFailedErrorResponse,
  })
  async refresh(
    @Request() req: ExpressRequest,
    @Body() body: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.hostname;
    return this.authService.refresh(body, fingerprint);
  }
}
