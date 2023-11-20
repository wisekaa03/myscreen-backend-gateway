import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsNotEmpty, IsDefined } from 'class-validator';

export class EditorLayerMoveRequest {
  @ApiProperty({
    description: 'Изменение индекса',
    type: 'integer',
    example: 1,
    default: 1,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  moveIndex!: number;
}
