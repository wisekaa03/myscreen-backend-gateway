import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { User } from '../user.dto';

export class UsersResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status;

  @ApiProperty({ description: 'Пользователи', type: [User] })
  data!: User[];
}

export class UserResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status;

  @ApiProperty({
    description: 'Папки',
    title: 'FolderResponse',
    type: User,
  })
  data!: User;
}
