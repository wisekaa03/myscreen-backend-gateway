import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@/enums/status.enum';

export class SuccessResponse {
  @ApiProperty({
    description: 'Статус операции',
    type: Status.Success,
    example: Status.Success,
  })
  status!: Status.Success;
}
