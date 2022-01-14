import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber } from 'class-validator';

export class EditorLayerMoveRequest {
  @ApiProperty({
    description: 'Изменение индекса',
    type: 'number',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  moveIndex!: number;
}
