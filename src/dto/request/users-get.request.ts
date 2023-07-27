import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { UserEntity } from '@/database/user.entity';
import { LimitRequest } from './limit.request';
import { UserPartialRequest } from './user-partial.request';

export class UsersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: UserPartialRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPartialRequest)
  where?: FindOptionsWhere<UserPartialRequest>;

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
  select?: FindOptionsSelect<UserPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<UserPartialRequest>;
}
