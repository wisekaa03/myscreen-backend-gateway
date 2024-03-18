import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class MonitorGroup {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Подчиненный монитор в группе мониторов',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  monitorId!: string;

  @ApiProperty({
    type: 'number',
    description: 'Подчиненный номер монитора в группе мониторов (строка)',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  row!: number;

  @ApiProperty({
    type: 'number',
    description: 'Подчиненный номер монитора в группе мониторов (колонка)',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  col!: number;
}
