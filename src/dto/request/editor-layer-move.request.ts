import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsNotEmpty } from 'class-validator';

export class EditorLayerMoveRequest {
  @ApiProperty({
    description: 'Изменение индекса',
    type: 'integer',
    example: 1,
    default: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  moveIndex!: number;
}
