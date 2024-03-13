import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { UserResponse } from '@/database/user-response.entity';

export class UserGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Пользователь',
    type: UserResponse,
  })
  data!: UserResponse;
}
