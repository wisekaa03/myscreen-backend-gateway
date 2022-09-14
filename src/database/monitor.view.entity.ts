import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  DataSource,
  SelectQueryBuilder,
  ViewColumn,
  ViewEntity,
} from 'typeorm';

import { MonitorEntity } from './monitor.entity';
import { MonitorFavoriteEntity } from './monitor.favorite.entity';

@ViewEntity({
  materialized: false,
  expression: (connection: DataSource) =>
    connection
      .createQueryBuilder()
      .select('"monitor".*')
      .from(MonitorEntity, 'monitor')
      .leftJoinAndSelect(
        (qb: SelectQueryBuilder<MonitorFavoriteEntity>) =>
          qb
            .select('"monitorFav"."id"', 'monitorFavId')
            .addSelect('"monitorFav"."userId"', 'monitorFavUserId')
            .from(MonitorFavoriteEntity, 'monitorFav'),
        'monitorFav',
        '"monitorFav"."monitorFavId" = "monitor"."id"' +
          ' AND "monitorFav"."monitorFavUserId" = "monitor"."userId"',
      ),
})
export class MonitorViewEntity extends OmitType(MonitorEntity, [
  'files',
  'favorities',
]) {
  @ViewColumn()
  @ApiProperty({
    description: 'Избранный монитор',
    example: false,
    required: true,
  })
  favorite?: boolean;
}
