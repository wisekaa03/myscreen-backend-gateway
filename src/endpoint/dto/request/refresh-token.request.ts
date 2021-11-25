import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenRequestDto {
  @ApiProperty({ example: 'secret' })
  @IsNotEmpty({ message: 'The refresh token is required' })
  token: string;
}
