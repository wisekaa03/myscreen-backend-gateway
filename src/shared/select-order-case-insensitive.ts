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
  if (orderBy) {
    Object.entries(orderBy).forEach(([field, order]) => {
      qb.addOrderBy(`LOWER(${qb.alias}.${field})`, order as 'ASC' | 'DESC');
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
  if (orderBy) {
    Object.entries(orderBy).forEach(([field, order]) => {
      if (field === 'createdAt' || field === 'updatedAt') {
        qb.addOrderBy(`${qb.alias}.${field}`, order as 'ASC' | 'DESC');
      } else {
        qb.addOrderBy(`LOWER(${qb.alias}.${field})`, order as 'ASC' | 'DESC');
      }
    });
  }
  return Promise.all([qb.getMany(), qb.getCount()]);
};
