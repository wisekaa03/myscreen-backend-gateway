import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { Token } from '@/dto/interface';
import { UserResponse } from '@/dto/response/user.response';
import { UserEntity } from '@/database/user.entity';
import { UserSizeEntity } from '@/database/user.view.entity';

export class AuthenticationPayload {
  @ApiProperty({ description: 'Тип: Bearer', example: 'bearer' })
  type!: 'bearer';

  @ApiProperty({
    description: 'Токен, используемый в Authorization: Bearer',
    example: 'eyJcbGciOcJIUcI1xxxxxxxxxxxxxxxx',
  })
  token!: Token;

  @ApiProperty({
    description: 'Refresh токен, используемый для запросов /api/v2/refresh',
    example: 'exJxcGxiOxJIxzIxNixsIxR5cxxxxxxxxxxx.E9jKilfGxxxxxxxxxxxxx',
  })
  refreshToken?: Token;
}

export class AuthResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Возвращаемый токен',
    type: AuthenticationPayload,
    required: true,
  })
  payload!: AuthenticationPayload;

  @ApiProperty({
    description: 'Пользователь',
    type: UserResponse,
    required: true,
  })
  data!: Partial<UserEntity> & Partial<UserSizeEntity>;
}

export class AuthRefreshResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Возвращаемый токен',
    type: AuthenticationPayload,
    required: true,
  })
  payload!: AuthenticationPayload;
}
