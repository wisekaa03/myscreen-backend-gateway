import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

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
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  playlistDuration!: number;

  @ApiProperty({
    description: 'Дата и время начала',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  dateFrom!: string;

  @ApiProperty({
    description: 'Дата и время окончания',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  dateTo!: string;
}
