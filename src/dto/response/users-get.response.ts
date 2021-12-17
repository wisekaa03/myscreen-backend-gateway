import { ApiProperty } from '@nestjs/swagger';

import { Status } from '../status.enum';
import { UserResponse } from './user.response';
import { UserEntity } from '@/database/user.entity';
import { UserSizeEntity } from '@/database/user.view.entity';

export class UsersGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Пользователи',
    title: 'UserResponse',
    type: UserResponse,
    isArray: true,
  })
  data!: Partial<UserEntity> & Partial<UserSizeEntity>[];
}
