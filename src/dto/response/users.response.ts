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

export class UserGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Пользователь',
    title: 'UserResponse',
    type: UserResponse,
  })
  data!: Partial<UserEntity> & Partial<UserSizeEntity>;
}
