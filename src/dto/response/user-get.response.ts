import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { UserExtView } from '@/database/user-ext.view';
import { UserResponse } from './user-response.response';

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
  data!: UserExtView;
}
