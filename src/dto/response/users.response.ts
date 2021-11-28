import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { User } from '@/dto/user.dto';

export class UsersResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status: Status;

  @ApiProperty()
  data: User[];
}
