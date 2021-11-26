import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../status.enum';

export class SuccessResponseDto {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status: Status;
}
