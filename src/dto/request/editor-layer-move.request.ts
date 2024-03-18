import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsNotEmpty, IsDefined } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class EditorLayerMoveRequest {
  @ApiProperty({
    description: 'Изменение индекса',
    type: 'integer',
    example: 1,
    default: 1,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  moveIndex!: number;
}
