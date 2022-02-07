import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class AuthMonitorRequest {
  @ApiProperty({
    description: 'Используется для обозначения монитора',
    // Используется для:
    // - GET /auth/auth-get,
    // - GET /file/file-get-s3
    // - POST /monitor/monitors-get
    // - GET /monitor/monitor-get
    // - GET /monitor/monitor-playlist'
    example: '123-456-789',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Length(11, 11)
  code!: string;
}
