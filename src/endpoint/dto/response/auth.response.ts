import { ApiProperty } from '@nestjs/swagger';

import { UserEntity } from '@/database/user.entity';
import { Status } from '../status.enum';

export class AuthResponseDto {
  @ApiProperty({ enum: Status, example: Status.Success })
  status: Status;

  @ApiProperty()
  data: UserEntity;
}
