import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { UserExtEntity } from '@/database/user.view.entity';

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
    type: UserExtEntity,
    isArray: true,
  })
  data!: UserExtEntity[];
}
