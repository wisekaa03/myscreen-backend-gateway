import { FindManyOptions } from 'typeorm';
import { LimitRequest } from '@/dto/request/limit.request';

export const paginationQueryToConfig = <T>(
  scope: LimitRequest<T> | undefined,
): FindManyOptions<T> => {
  const pagination: FindManyOptions<T> = {};

  if (scope?.limit) {
    pagination.take = scope.limit;

    if (scope?.page && scope.page > 0) {
      pagination.skip = scope.limit * (scope.page - 1);
    }
  }

  if (scope?.order) {
    pagination.order = scope.order;
  }

  return pagination;
};
