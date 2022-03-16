import { ApiProperty } from '@nestjs/swagger';
import {
  Connection,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { FileEntity } from './file.entity';
import { UserEntity } from './user.entity';

@ViewEntity({
  materialized: false,
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select('"user".*')
      .from(UserEntity, 'user')
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<FileEntity>) =>
          qb
            .select('"file"."userId"')
            .addSelect('SUM("file"."filesize")', 'countUsedSpace')
            .groupBy('"file"."userId"')
            .from(FileEntity, 'file'),
        'file',
        '"file"."userId" = "user"."id"',
      ),
})
export class UserSizeEntity extends UserEntity {
  @ViewColumn()
  @ApiProperty({
    description: 'Использованное место',
    example: 0,
    required: false,
  })
  countUsedSpace?: number;
}
