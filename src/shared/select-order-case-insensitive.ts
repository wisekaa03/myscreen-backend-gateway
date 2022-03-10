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
      if (
        field === 'createdAt' ||
        field === 'updatedAt' ||
        field === 'category' ||
        field === 'status' ||
        field === 'address' ||
        field === 'totalDuration' ||
        field === 'renderingStatus' ||
        field === 'role'
      ) {
        qb.addOrderBy(
          `${qb.alias}.${field}`,
          order === 'DESC' ? 'DESC' : 'ASC',
        );
      } else {
        qb.addOrderBy(
          `LOWER(${qb.alias}.${field})`,
          order === 'DESC' ? 'DESC' : 'ASC',
        );
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
  if (orderBy) {
    Object.entries(orderBy).forEach(([field, order]) => {
      if (
        field === 'createdAt' ||
        field === 'updatedAt' ||
        field === 'category' ||
        field === 'status' ||
        field === 'address' ||
        field === 'totalDuration' ||
        field === 'renderingStatus' ||
        field === 'role'
      ) {
        qb.addOrderBy(
          `${qb.alias}.${field}`,
          order === 'DESC' ? 'DESC' : 'ASC',
        );
      } else {
        qb.addOrderBy(
          `LOWER(${qb.alias}.${field})`,
          order === 'DESC' ? 'DESC' : 'ASC',
        );
      }
    });
  }
  return Promise.all([qb.getMany(), qb.getCount()]);
};
