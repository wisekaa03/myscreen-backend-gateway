import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { UserEntity } from '@/database/user.entity';
import { LimitRequest } from './limit.request';
import { UserRequest } from './user.request';

export class UsersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: UserRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserRequest)
  where?: FindOptionsWhere<UserRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(UserEntity).filter(
      (user) => user !== 'password',
    ),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<UserRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<UserRequest>;
}
