import { ApiProperty } from '@nestjs/swagger';
import {
  Connection,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';
import { MediaEntity } from './media.entity';
import { UserEntity } from './user.entity';

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select('"user".*')
      .from(UserEntity, 'user')
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MediaEntity>) =>
          qb
            .select('"media"."userId"')
            .addSelect('SUM("media"."filesize")', 'countUsedSpace')
            .groupBy('"media"."userId"')
            .from(MediaEntity, 'media'),
        'media',
        '"media"."userId" = "user"."id"',
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
