import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { User } from '@/dto/user.dto';

export class AuthenticationPayloadDto {
  @ApiProperty({ description: 'Тип: Bearer', example: 'bearer' })
  type: string;

  @ApiProperty({
    description: 'Токен, используемый в Authorization: Bearer',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2Mzc4NTMzM...',
  })
  token: string;

  @ApiProperty({
    description: 'Refresh токен, используемый для запросов /api/v2/refresh',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2Mzc4NTc4O...',
    required: false,
  })
  refresh_token?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status: Status;

  @ApiProperty({ description: 'Возвращаемый токен' })
  payload?: AuthenticationPayloadDto;

  @ApiProperty()
  data: User;
}
