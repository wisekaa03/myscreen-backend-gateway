import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { UserResponse } from '@/database/user-response.entity';

export class UsersGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество пользователей' })
  count!: number;

  @ApiProperty({
    description: 'Пользователи',
    type: UserResponse,
    isArray: true,
  })
  data!: UserResponse[];
}
