import type { FindManyOptions, FindOneOptions } from 'typeorm';
import { LimitRequest } from '@/dto/request/limit.request';

export type ScopeOrder<T> = FindOneOptions<T>['order'];

export const paginationQueryToConfig = <T>(
  scope?: LimitRequest<T>,
): FindManyOptions<T> => {
  const pagination: FindManyOptions<T> = {};

  if (scope) {
    if (scope.limit) {
      pagination.take = scope.limit;

      if (scope.page && scope.page > 0) {
        pagination.skip = scope.limit * (scope.page - 1);
      }
    }

    if (scope.order) {
      const order: ScopeOrder<T> = {};
      Object.entries(scope.order).forEach(([id, orderBy]) => {
        // @ts-ignore
        order[id] = orderBy ?? 'ASC';
      });
      pagination.order = order;
    }
  }

  return pagination;
};
