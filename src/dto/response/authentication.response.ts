import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { User } from '@/dto/user.dto';

export class AuthenticationPayload {
  @ApiProperty({ description: 'Тип: Bearer', example: 'bearer' })
  type: string;

  @ApiProperty({
    description: 'Токен, используемый в Authorization: Bearer',
    example: 'eyJcbGciOcJIUcI1xxxxxxxxxxxxxxxx',
  })
  token: string;

  @ApiProperty({
    description: 'Refresh токен, используемый для запросов /api/v2/refresh',
    example: 'exJxcGxiOxJIxzIxNixsIxR5cxxxxxxxxxxx.E9jKilfGxxxxxxxxxxxxx',
    required: false,
  })
  refresh_token?: string;
}

export class AuthResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status: Status;

  @ApiProperty({
    description: 'Возвращаемый токен',
    title: 'AuthenticationPayload',
    type: AuthenticationPayload,
  })
  payload?: AuthenticationPayload;

  @ApiProperty({
    description: 'Пользователь',
    title: 'User',
    type: User,
  })
  data: User;
}
