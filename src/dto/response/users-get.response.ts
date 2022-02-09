import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { UserEntity } from '@/database/user.entity';
import { UserSizeEntity } from '@/database/user.view.entity';
import { UserResponse } from './user.response';

export class UsersGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Пользователи',
    type: UserResponse,
    isArray: true,
  })
  data!: Partial<UserEntity> & Partial<UserSizeEntity>[];
}
