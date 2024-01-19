import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class MonitorMultipleResponse {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Подчиненный монитор в группе мониторов',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  monitorId!: string;

  @ApiProperty({
    type: 'number',
    description: 'Подчиненный номер монитора в группе мониторов (строка)',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  row!: number;

  @ApiProperty({
    type: 'number',
    description: 'Подчиненный номер монитора в группе мониторов (колонка)',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  col!: number;
}
