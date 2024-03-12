import {
  Body,
  Get,
  HttpCode,
  Ip,
  Logger,
  NotAcceptableException,
  NotFoundException,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';

import {
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
  UserGetResponse,
  AuthMonitorRequest,
} from '@/dto';
import { ApiComplexDecorators, Crud, Roles } from '@/decorators';
import { CRUD, Status, UserRoleEnum } from '@/enums';
import { RolesGuard, JwtAuthGuard } from '@/guards';
import { AuthService } from '@/auth/auth.service';
import { UserService } from '@/database/user.service';
import { MonitorService } from '@/database/monitor.service';

@ApiComplexDecorators({ path: ['auth'] })
export class AuthController {
  logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly monitorService: MonitorService,
    private readonly userService: UserService,
  ) {}

  @Get()
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
  @Crud(CRUD.READ)
  async authorization(
    @Req() { user: data }: ExpressRequest,
  ): Promise<UserGetResponse> {
    return {
      status: Status.Success,
      data,
    };
  }

  @Patch()
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Advertiser,
    UserRoleEnum.Accountant,
  ])
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
  @Crud(CRUD.UPDATE)
  async update(
    @Req() { user }: ExpressRequest,
    @Body() update: UserUpdateRequest,
  ): Promise<UserGetResponse> {
    if (user.role !== UserRoleEnum.Administrator && update.role !== undefined) {
      throw new NotAcceptableException(
        'Role is updated when Administrator logged in',
      );
    }
    if (user.role !== UserRoleEnum.Administrator && update.plan !== undefined) {
      throw new NotAcceptableException(
        'Plan is updated when Administrator logged in',
      );
    }
    if (
      user.role !== UserRoleEnum.Administrator &&
      update.disabled !== undefined
    ) {
      throw new NotAcceptableException(
        'Disabled is updated when Administrator logged in',
      );
    }
    if (
      user.role !== UserRoleEnum.Administrator &&
      update.verified !== undefined
    ) {
      throw new NotAcceptableException(
        'Verified is updated when Administrator logged in',
      );
    }

    const data = await this.userService.update(user.id, update);
    if (!data) {
      throw new UnauthorizedException();
    }

    return {
      status: Status.Success,
      data: UserService.userEntityToUser(data),
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
  @Crud(CRUD.UPDATE)
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
  @Crud(CRUD.CREATE)
  async register(@Body() body: RegisterRequest): Promise<UserGetResponse> {
    const data = await this.userService.register(body);

    return {
      status: Status.Success,
      data,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ operationId: 'refresh', summary: 'Обновление токена' })
  @ApiResponse({
    status: 200,
    description: 'Успешный ответ',
    type: AuthRefreshResponse,
  })
  @Crud(CRUD.UPDATE)
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

  @Post('email-verify')
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
  @Crud(CRUD.UPDATE)
  async verifyEmail(
    @Body() { verify }: VerifyEmailRequest,
  ): Promise<SuccessResponse> {
    await this.authService.verifyEmail(verify);

    return {
      status: Status.Success,
    };
  }

  @Post('reset-password')
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
  @Crud(CRUD.UPDATE)
  async resetPasswordInvitation(
    @Body() { email }: ResetPasswordInvitationRequest,
  ): Promise<SuccessResponse> {
    await this.userService.forgotPasswordInvitation(email);

    return {
      status: Status.Success,
    };
  }

  @Post('reset-password-verify')
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
  @Crud(CRUD.UPDATE)
  async resetPasswordVerify(
    @Body() { verify, password }: ResetPasswordVerifyRequest,
  ): Promise<SuccessResponse> {
    await this.userService.forgotPasswordVerify(verify, password);

    return {
      status: Status.Success,
    };
  }

  @Patch('disable')
  @HttpCode(200)
  @Roles([
    UserRoleEnum.Administrator,
    UserRoleEnum.MonitorOwner,
    UserRoleEnum.Advertiser,
  ])
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
  @Crud(CRUD.DELETE)
  async disable(
    @Req() { user: { id: userId } }: ExpressRequest,
  ): Promise<SuccessResponse> {
    await this.userService.update(userId, { disabled: true });

    return {
      status: Status.Success,
    };
  }

  @Post('monitor')
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
  @Crud(CRUD.UPDATE)
  async monitor(
    @Body() { code }: AuthMonitorRequest,
  ): Promise<AuthRefreshResponse> {
    const monitor = await this.monitorService.findOne({
      find: {
        where: { attached: false, code },
        loadEagerRelations: false,
        relations: {},
      },
    });
    if (!monitor) {
      throw new NotFoundException(`Monitor with code "${code}" does not exist`);
    }

    const payload = await this.authService.createMonitorToken(monitor.id);

    if (monitor.code !== null) {
      await this.monitorService.update(monitor.id, {
        code: null,
      });
    }

    return {
      status: Status.Success,
      payload,
    };
  }
}
