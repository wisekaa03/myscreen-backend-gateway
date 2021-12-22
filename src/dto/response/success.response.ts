import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@/enums/status.enum';

export class SuccessResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;
}
