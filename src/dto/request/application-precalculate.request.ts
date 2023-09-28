import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import subDays from 'date-fns/subDays';

export class ApplicationPrecalculateRequest {
  @ApiProperty({
    description: 'Мониторы для расчета',
    type: String,
    format: 'uuid',
    isArray: true,
    required: true,
  })
  @IsUUID('all', { each: true })
  monitorsId!: string[];

  @ApiProperty({
    description: 'Длительность плейлиста (в секундах)',
    type: Number,
    example: 60,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  playlistDuration!: number;

  @ApiProperty({
    description: 'Дата и время начала',
    type: Date,
    example: subDays(new Date(), 1).toISOString(),
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  dateFrom!: string;

  @ApiProperty({
    description: 'Дата и время окончания',
    type: Date,
    example: new Date().toISOString(),
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  dateTo!: string;
}
