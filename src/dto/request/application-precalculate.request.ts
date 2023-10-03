import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import format from 'date-fns/format';
import subDays from 'date-fns/subDays';
import { dateLocalNow } from '../interface';

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
  @IsNotEmpty()
  @IsNumber()
  playlistDuration!: number;

  @ApiProperty({
    description: 'Дата и время начала',
    type: Date,
    example: format(subDays(dateLocalNow, 1), "yyyy-LL-dd'T'00:00:00.000'Z'"),
    required: true,
  })
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateFrom!: string;

  @ApiProperty({
    description: 'Дата и время окончания',
    type: Date,
    example: format(dateLocalNow, "yyyy-LL-dd'T'23:59:59.999'Z'"),
    required: true,
  })
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateTo!: string;
}
