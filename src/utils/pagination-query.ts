import type { FindManyOptions, FindOneOptions } from 'typeorm';

import { BadRequestError } from '@/errors';
import { LimitRequest } from '@/dto/request/limit.request';

export type ScopeOrder = FindOneOptions<any>['order'];

export const paginationQuery = <T>(
  scope?: LimitRequest,
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
      const order: ScopeOrder = {};
      Object.entries(scope.order).forEach(([field, orderBy]) => {
        if (field !== 'favorite') {
          switch (orderBy) {
            case 'ASC':
              order[field] = 'ASC';
              break;
            case 'DESC':
              order[field] = 'DESC';
              break;
            case undefined:
              break;
            default:
              throw new BadRequestError(
                `Order field '${field}' is not an 'ASC' or 'DESC'`,
              );
          }
        }
      });
      pagination.order = order;
    }
  }

  return pagination;
};
