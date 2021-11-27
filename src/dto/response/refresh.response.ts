import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponse {
  @ApiProperty({ description: 'Возвращаемый токен' })
  token?: string;
}
