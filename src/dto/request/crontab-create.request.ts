import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CrontabCreateRequest {
  @ApiProperty({
    description: 'Crontab: "Second Minute Hour DayOfMonth Month DayOfWeek"',
    type: String,
    example: '0 0 0 * * *',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  crontab?: string;
}
