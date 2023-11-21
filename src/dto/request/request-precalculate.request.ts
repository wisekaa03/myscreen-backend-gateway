import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class ApplicationPrecalculateRequest {
  @ApiProperty({
    description: 'Мониторы для расчета',
    type: String,
    format: 'uuid',
    isArray: true,
    required: true,
  })
  @IsUUID('all', { each: true })
  monitorIds!: string[];

  @ApiProperty({
    description: 'Длительность плейлиста (в секундах)',
    type: Number,
    example: 60,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  playlistDuration!: number;

  @ApiProperty({
    description: 'Дата и время начала',
    example: '2021-01-01',
    type: 'string',
    format: 'date',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateFrom!: string;

  @ApiProperty({
    description: 'Дата и время окончания',
    example: '2021-12-31',
    type: 'string',
    format: 'date',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateTo!: string;
}
