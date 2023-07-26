import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { UserExtEntity } from '@/database/user.view.entity';

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
    type: UserExtEntity,
  })
  data!: UserExtEntity;
}
