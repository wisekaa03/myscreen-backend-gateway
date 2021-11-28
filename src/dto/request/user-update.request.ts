import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

import { UserRole } from '@/database/enums/role.enum';

export class UserUpdateRequest {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.Advertiser,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false, example: 'John' })
  @IsString()
  name: UserRole;

  @ApiProperty({ required: false, example: 'Steve' })
  @IsString()
  surname: UserRole;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsString()
  middleName?: UserRole;

  @ApiProperty({ required: false, example: 'RU' })
  country?: string;

  @ApiProperty({ required: false, example: 'Acme company' })
  company?: string;

  @ApiProperty({ required: false, example: '+78002000000' })
  phoneNumber?: string;
}
