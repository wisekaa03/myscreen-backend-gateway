import { Logger } from '@nestjs/common';
import { FindManyOptions, FindOptionsUtils, Repository } from 'typeorm';

export const findOrderByCaseInsensitive = <T>(
  repository: Repository<T>,
  find: FindManyOptions<T>,
): Promise<T[]> => {
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
  return qb.getMany();
};

export const findOrderByCaseInsensitiveCount = <T>(
  repository: Repository<T>,
  find: FindManyOptions<T>,
): Promise<[T[], number]> => {
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
  const logger = new Logger();
  logger.debug(qb.getSql());
  return Promise.all([qb.getMany(), 1]);
};
