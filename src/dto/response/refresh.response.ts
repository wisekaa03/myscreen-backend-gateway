import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../status.enum';

export class RefreshTokenResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Токен, используемый в Authorization: Bearer',
    example: 'eyJcbGciOcJIUcI1xxxxxxxxxxxxxxxx',
    required: true,
  })
  token?: string;
}
