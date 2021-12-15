import { ApiProperty } from '@nestjs/swagger';

import { Status } from '../status.enum';
import { User } from '../user.dto';
import { UserEntity } from '@/database/user.entity';
import { UserSizeEntity } from '@/database/user.view.entity';

export class UsersResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Пользователи', type: [User], isArray: true })
  data!: Partial<UserEntity> & Partial<UserSizeEntity>[];
}

export class UserResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Пользователь',
    title: 'User',
    type: User,
  })
  data!: Partial<UserEntity> & Partial<UserSizeEntity>;
}
