import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { UserEntity } from '../../database/user.entity';

export class UsersResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status: Status;

  @ApiProperty()
  data: UserEntity[];
}
