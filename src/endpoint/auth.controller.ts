import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Patch,
  Post,
  Req,
  UnauthorizedException,
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
  ServiceUnavailableError,
  LoginRequest,
  UserUpdateRequest,
  RegisterRequest,
  VerifyEmailRequest,
  ResetPasswordInvitationRequest,
  ResetPasswordVerifyRequest,
  AuthRefreshRequest,
  AuthResponse,
  AuthRefreshResponse,
  SuccessResponse,
  userEntityToUser,
  UserGetResponse,
} from '@/dto';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { Status } from '@/enums/status.enum';
import { AuthService } from '@/auth/auth.service';
import { UserService } from '@/database/user.service';

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
  status: 412,
  description: 'Пользователь уже существует',
  type: PreconditionFailedError,
})
@ApiResponse({
  status: 500,
  description: 'Ошибка сервера',
  type: InternalServerError,
})
@ApiResponse({
  status: 503,
  description: 'Ошибка сервера',
  type: ServiceUnavailableError,
})
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('/')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'auth-get',
    summary:
      'Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserGetResponse,
  })
  async authorization(
    @Req() { user }: ExpressRequest,
  ): Promise<UserGetResponse> {
    if (!user) {
      throw new UnauthorizedException();
    }
    const data = userEntityToUser(user);

    return {
      status: Status.Success,
      data,
    };
  }

  @Patch('/')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'auth-update',
    summary: 'Изменение аккаунта пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: UserGetResponse,
  })
  async update(
    @Req() { user }: ExpressRequest,
    @Body() update: UserUpdateRequest,
  ): Promise<UserGetResponse> {
    const data = await this.userService.update(user, update);

    return {
      status: Status.Success,
      data: userEntityToUser(data),
    };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ operationId: 'login', summary: 'Авторизация пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async login(
    @Req() req: ExpressRequest,
    @Body() { email, password }: LoginRequest,
  ): Promise<AuthResponse> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.ip;

    const [data, payload] = await this.authService.login(
      email,
      password,
      fingerprint,
    );

    return {
      status: Status.Success,
      payload,
      data,
    };
  }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    operationId: 'register',
    summary: 'Регистрация пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: UserGetResponse,
  })
  async register(@Body() body: RegisterRequest): Promise<UserGetResponse> {
    const data = userEntityToUser(await this.userService.create(body));

    return {
      status: Status.Success,
      data,
    };
  }

  @Post('/refresh')
  @HttpCode(200)
  @ApiOperation({ operationId: 'refresh', summary: 'Обновление токена' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthRefreshResponse,
  })
  async refresh(
    @Req() req: ExpressRequest,
    @Body() { refreshToken }: AuthRefreshRequest,
  ): Promise<AuthRefreshResponse> {
    // TODO: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const fingerprint = req?.ip;

    const payload = await this.authService.createAccessTokenFromRefreshToken(
      refreshToken,
      fingerprint,
    );

    return {
      status: Status.Success,
      payload,
    };
  }

  @Post('/email-verify')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'email-verify',
    summary: 'Подтвердить email пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async verifyEmail(
    @Body() { verify }: VerifyEmailRequest,
  ): Promise<SuccessResponse> {
    await this.authService.verifyEmail(verify);

    return {
      status: Status.Success,
    };
  }

  @Post('/reset-password')
  @HttpCode(200)
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
    @Body() { email }: ResetPasswordInvitationRequest,
  ): Promise<SuccessResponse> {
    await this.userService.forgotPasswordInvitation(email);

    return {
      status: Status.Success,
    };
  }

  @Post('/reset-password-verify')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'reset-password-verify',
    summary: 'Меняет пароль пользователя по приглашению из почты',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async resetPasswordVerify(
    @Body() { verify, password }: ResetPasswordVerifyRequest,
  ): Promise<SuccessResponse> {
    await this.userService.forgotPasswordVerify(verify, password);

    return {
      status: Status.Success,
    };
  }

  @Patch('/disable')
  @HttpCode(200)
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
  async disable(@Req() { user }: ExpressRequest): Promise<SuccessResponse> {
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.userService.update(user, { disabled: true });

    return {
      status: Status.Success,
    };
  }
}
