import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '@/database/user.entity';

import { Status } from '../status.enum';
import { User } from '../user.dto';

export class UsersResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Пользователи', type: [User], isArray: true })
  data!: Partial<UserEntity>[];
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
  data!: Partial<UserEntity>;
}
