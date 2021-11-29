import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { User } from '@/dto/user.dto';

export class AuthenticationPayload {
  @ApiProperty({ description: 'Тип: Bearer', example: 'bearer' })
  type: string;

  @ApiProperty({
    description: 'Токен, используемый в Authorization: Bearer',
    example:
      'eyJcbGciOcJIUcI1xxxxxxxxxxxxxxxxxxx.eyJxYXQiOxE2MdfcyDI2Mxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxn0.Mmdi-pZl1xxxxxxxxxxxxxxxxxxxxxxxxxxGfJlWM',
  })
  token: string;

  @ApiProperty({
    description: 'Refresh токен, используемый для запросов /api/v2/refresh',
    example:
      'exJxcGxiOxJIxzIxNixsIxR5cxxxxxxxxxxx.eyJpYXQiOjE2MzgyMDI2MxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxIn0.E9jKilfGxxxxxxxxxxxxxOlP-GvhkxxxxxxxxxxNw0o',
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

  @ApiProperty({ description: 'Возвращаемый токен' })
  payload?: AuthenticationPayload;

  @ApiProperty()
  data: User;
}
