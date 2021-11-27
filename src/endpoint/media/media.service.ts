import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  Status,
  userEntityToUser,
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
  PreconditionFailedError,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  VerifyEmailRequest,
  ResetPasswordVerifyRequest,
  RefreshTokenResponse,
  AuthenticationPayload,
  SuccessResponse,
  ResetPasswordInvitationRequest,
  MediaGetFilesResponse,
} from '@/dto';

import { UserService } from '@/database/user.service';
import { UserEntity } from '@/database/user.entity';

@Injectable()
export class MediaService {
  logger = new Logger(MediaService.name);

  constructor(private readonly configService: ConfigService) {}

  async getMedia(): Promise<MediaGetFilesResponse> {
    throw new BadRequestError();
  }
}
