import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class EditorExportRequest {
  @ApiProperty({
    description: 'Перезапустить рендеринг',
    required: false,
    default: false,
    example: false,
  })
  @IsOptional()
  rerender?: boolean;
}
