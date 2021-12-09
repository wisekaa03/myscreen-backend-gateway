import { FindManyOptions } from 'typeorm';
import { LimitRequest } from '@/dto/request/limit.request';

export const paginationQueryToConfig = <T>(
  scope: LimitRequest<T> | undefined,
): FindManyOptions<T> =>
  scope
    ? {
        take: scope?.limit,
        skip:
          scope?.page && scope.page > 0
            ? (scope.limit ?? 0) * (scope.page - 1)
            : undefined,
        order: scope?.order ?? undefined,
      }
    : {};
