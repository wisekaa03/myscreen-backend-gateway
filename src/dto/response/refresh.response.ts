import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponse {
  @ApiProperty({
    description: 'Токен, используемый в Authorization: Bearer',
    example: 'eyJcbGciOcJIUcI1xxxxxxxxxxxxxxxx',
  })
  token?: string;
}
