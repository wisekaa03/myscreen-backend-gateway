import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class AuthMonitorRequest {
  @ApiProperty({
    description: 'Используется для обозначения монитора',
    // Используется для:
    // - GET /auth/auth-get,
    // - GET /file/file-get-s3
    // - POST /monitor/monitors-get
    // - GET /monitor/monitor-get
    // - GET /monitor/monitor-playlist'
    pattern: '^[0-9]{3}-[0-9]{3}-[0-9]{3}$',
    example: '123-456-789',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Length(11, 11)
  @Matches(/^[0-9]{3}-[0-9]{3}-[0-9]{3}$/)
  code!: string;
}
