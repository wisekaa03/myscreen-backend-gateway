import {
  Body,
  Get,
  HttpCode,
  Logger,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';

import { NotAcceptableError, NotFoundError, UnauthorizedError } from '@/errors';
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
import { UserResponseToExternal } from '@/database/user-response.entity';
import { UserEntity } from '@/database/user.entity';

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
    @Req() { user }: ExpressRequest,
  ): Promise<UserGetResponse> {
    return {
      status: Status.Success,
      data: UserResponseToExternal(user),
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
    const { role } = user;
    if (role !== UserRoleEnum.Administrator && update.role !== undefined) {
      throw new NotAcceptableError(
        'Role is updated when Administrator logged in',
      );
    }
    if (role !== UserRoleEnum.Administrator && update.plan !== undefined) {
      throw new NotAcceptableError(
        'Plan is updated when Administrator logged in',
      );
    }
    if (role !== UserRoleEnum.Administrator && update.disabled !== undefined) {
      throw new NotAcceptableError(
        'Disabled is updated when Administrator logged in',
      );
    }
    if (
      role !== UserRoleEnum.Administrator &&
      (update as UserEntity).verified !== undefined
    ) {
      throw new NotAcceptableError(
        'Verified is updated when Administrator logged in',
      );
    }
    if ((update as UserEntity).password !== undefined) {
      throw new NotAcceptableError(
        'The password is changed using a different procedure',
      );
    }
    if ((update as UserEntity).emailConfirmKey !== undefined) {
      throw new NotAcceptableError('Hidden column');
    }
    if ((update as UserEntity).forgotConfirmKey !== undefined) {
      throw new NotAcceptableError('Hidden column');
    }
    if ((update as UserEntity).id !== undefined) {
      throw new NotAcceptableError('Hidden column');
    }
    if ((update as UserEntity).nonPayment !== undefined) {
      throw new NotAcceptableError('Hidden column');
    }
    if ((update as UserEntity).updatedAt !== undefined) {
      throw new NotAcceptableError('Hidden column');
    }
    if ((update as UserEntity).createdAt !== undefined) {
      throw new NotAcceptableError('Hidden column');
    }

    const data = await this.userService.update(user, update);
    if (!data) {
      throw new UnauthorizedError();
    }

    return {
      status: Status.Success,
      data: UserResponseToExternal(data),
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
    @Req() req: ExpressRequest,
    @Body() { email, password }: LoginRequest,
  ): Promise<AuthResponse> {
    const userAgent = req.headers['user-agent'] || '-';
    const fingerprint = (req.headers['x-real-ip'] as string) ?? req.ip ?? '-';
    // DEBUG: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const [data, payload] = await this.authService.login(
      email,
      password,
      fingerprint,
      userAgent,
    );

    return {
      status: Status.Success,
      payload,
      data: UserResponseToExternal(data),
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
      data: UserResponseToExternal(data),
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
    @Req() req: ExpressRequest,
    @Body() { refreshToken }: AuthRefreshRequest,
  ): Promise<AuthRefreshResponse> {
    const userAgent = req.headers['user-agent'] || '-';
    const fingerprint = (req.headers['x-real-ip'] as string) ?? req.ip ?? '-';
    // DEBUG: нужно ли нам это, fingerprint ? я считаю что нужно :)
    const payload = await this.authService.createAccessTokenFromRefreshToken(
      refreshToken,
      fingerprint,
      userAgent,
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
  async disable(@Req() { user }: ExpressRequest): Promise<SuccessResponse> {
    await this.userService.update(user, { disabled: true });

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
      throw new NotFoundError(`Monitor with code '${code}' does not exist`);
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
