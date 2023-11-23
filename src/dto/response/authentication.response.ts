import { ApiProperty } from '@nestjs/swagger';

import { Token } from '@/interfaces';
import { Status } from '@/enums/status.enum';
import { UserExtEntity } from '@/database/user-ext.entity';

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
    type: UserExtEntity,
    required: true,
  })
  data!: UserExtEntity;
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
