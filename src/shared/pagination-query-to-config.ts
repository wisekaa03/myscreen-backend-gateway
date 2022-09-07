import type { FindManyOptions, FindOneOptions } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { LimitRequest } from '../dto/request/limit.request';

export type ScopeOrder = FindOneOptions<any>['order'];

export const paginationQueryToConfig = <T>(
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
        switch (orderBy) {
          case 'ASC':
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            order[field] = 'ASC';
            break;
          case 'DESC':
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            order[field] = 'DESC';
            break;
          default:
            throw new BadRequestException(
              `Order field '${field}' is not an 'ASC' or 'DESC'`,
            );
        }
      });
      pagination.order = order;
    }
  }

  return pagination;
};
