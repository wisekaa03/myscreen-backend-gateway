import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class RequestPrecalcSumRequest {
  @ApiProperty({
    description: 'Плэйлист ID',
    format: 'uuid',
  })
  @IsUUID()
  playlistId!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Гарантированное минимальное количество показов в день',
    example: 1,
    required: true,
  })
  @IsInt()
  minWarranty!: number;

  @ApiProperty({
    type: 'integer',
    description: 'Стоимость показа 1 секунды в рублях',
    example: 1,
    required: true,
  })
  @IsInt()
  price1s!: number;

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
  dateBefore!: string;

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
  dateWhen!: string;
}
