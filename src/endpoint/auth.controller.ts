import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Ip,
  Logger,
  NotFoundException,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import addMonths from 'date-fns/addMonths';
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
  AuthMonitorRequest,
  NotFoundError,
} from '@/dto';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { Status, UserRoleEnum } from '@/enums';
import { AuthService } from '@/auth/auth.service';
import { UserService } from '@/database/user.service';
import { MonitorService } from '@/database/monitor.service';
import { Roles, RolesGuard } from '@/guards';

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
  status: 404,
  description: 'Монитор не найден',
  type: NotFoundError,
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
    private readonly monitorService: MonitorService,
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
    return {
      status: Status.Success,
      data: userEntityToUser(user),
    };
  }

  @Patch('/')
  @HttpCode(200)
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Advertiser,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    @Req() { user: { id: userId } }: ExpressRequest,
    @Body() update: UserUpdateRequest,
  ): Promise<UserGetResponse> {
    const data = await this.userService.update(userId, update);

    return {
      status: Status.Success,
      data: userEntityToUser(data),
    };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'auth-login',
    summary: 'Авторизация пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthResponse,
  })
  async login(
    @Ip() fingerprint: string,
    @Body() { email, password }: LoginRequest,
  ): Promise<AuthResponse> {
    // DEBUG: нужно ли нам это, fingerprint ? я считаю что нужно :)
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
    operationId: 'auth-register',
    summary: 'Регистрация пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Успешный ответ',
    type: UserGetResponse,
  })
  async register(@Body() body: RegisterRequest): Promise<UserGetResponse> {
    const data = userEntityToUser(await this.userService.register(body));

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
    @Ip() fingerprint: string,
    @Body() { refreshToken }: AuthRefreshRequest,
  ): Promise<AuthRefreshResponse> {
    // DEBUG: нужно ли нам это, fingerprint ? я считаю что нужно :)
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
    operationId: 'auth-email-verify',
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
    operationId: 'auth-reset-password',
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
    operationId: 'auth-reset-password-verify',
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
  @Roles(
    UserRoleEnum.Administrator,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Advertiser,
  )
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'auth-disable',
    summary: 'Скрытие аккаунта пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: SuccessResponse,
  })
  async disable(
    @Req() { user: { id: userId } }: ExpressRequest,
  ): Promise<SuccessResponse> {
    await this.userService.update(userId, { disabled: true });

    return {
      status: Status.Success,
    };
  }

  @Post('/monitor')
  @HttpCode(200)
  @ApiOperation({
    operationId: 'auth-monitor',
    summary: 'Авторизация монитора',
  })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthRefreshResponse,
  })
  async monitor(
    @Body() { code }: AuthMonitorRequest,
  ): Promise<AuthRefreshResponse> {
    const monitor = await this.monitorService.findOne(
      'monitorFavoritiesDisabled',
      {
        where: { attached: false, code },
      },
    );
    if (!monitor) {
      throw new NotFoundException('This monitor does not exist');
    }

    const payload = await this.authService.createMonitorToken(monitor.id);

    await this.monitorService.update(
      monitor.userId,
      Object.assign(monitor, { code: null }),
    );

    return {
      status: Status.Success,
      payload,
    };
  }
}
