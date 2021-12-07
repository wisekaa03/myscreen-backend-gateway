import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { UserEntity } from '@/database/user.entity';
import { User } from '../user.dto';

export class UsersResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status;

  @ApiProperty({ description: 'Пользователи', type: [User] })
  data!: Partial<User>[];
}

export class UserResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status;

  @ApiProperty()
  data!: Partial<UserEntity>;
}
