import { Logger } from '@nestjs/common';
import {
  FindManyOptions,
  FindOptionsUtils,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

export class TypeOrmFind {
  private static findOrder = <T>(
    repository: Repository<T>,
    find: FindManyOptions<T>,
  ): SelectQueryBuilder<T> => {
    const { order: orderBy, ...withoutOrder } = find;
    const qb = FindOptionsUtils.applyOptionsToQueryBuilder<T>(
      repository.createQueryBuilder(),
      withoutOrder,
    );
    const columns = repository.metadata.ownColumns;
    if (orderBy) {
      Object.entries(orderBy).forEach(([field, direction]) => {
        const column = columns.find(
          (value) => value.databaseName === field,
        )?.type;
        const d = direction === 'DESC' ? 'DESC' : 'ASC';
        // TODO: эх... разобраться с relations
        if (column !== String || (find.relations && (find.take || find.skip))) {
          qb.addOrderBy(`${qb.alias}.${field}`, d);
        } else {
          qb.addSelect(`LOWER(${qb.alias}.${field})`, `${field}_${d}`);
          qb.addOrderBy(`"${field}_${d}"`, d);
        }
      });
    }
    {
      const logger = new Logger('ORDER');
      logger.debug(qb.getSql());
    }
    return qb;
  };

  static orderCI = <T>(
    repository: Repository<T>,
    find: FindManyOptions<T>,
  ): Promise<T[]> => {
    const qb = this.findOrder(repository, find);
    return qb.getMany();
  };

  static orderCICount = <T>(
    repository: Repository<T>,
    find: FindManyOptions<T>,
  ): Promise<[T[], number]> => {
    const qb = this.findOrder(repository, find);
    return Promise.all([qb.getMany(), qb.getCount()]);
  };
}
