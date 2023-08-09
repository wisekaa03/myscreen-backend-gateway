import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CrontabCreateRequest {
  @ApiProperty({
    description: 'Crontab: "Second Minute Hour DayOfMonth Month DayOfWeek"',
    type: String,
    example: '0 0 0 * * *',
    required: false,
  })
  @IsOptional()
  @IsString()
  crontab?: string;
}
