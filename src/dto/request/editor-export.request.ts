import { ApiProperty } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';

export class EditorExportRequest {
  @ApiProperty({
    description: 'Перезапустить рендеринг',
    required: false,
    default: false,
    example: false,
  })
  @IsDefined()
  rerender?: boolean;
}
