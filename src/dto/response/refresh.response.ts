import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponse {
  @ApiProperty({
    description: 'Токен, используемый в Authorization: Bearer',
    example:
      'eyJcbGciOcJIUcI1xxxxxxxxxxxxxxxxxxx.eyJxYXQiOxE2MdfcyDI2Mxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxn0.Mmdi-pZl1xxxxxxxxxxxxxxxxxxxxxxxxxxGfJlWM',
  })
  token?: string;
}
