import { Order } from '@/dto/request/limit-order.request';
import { paginationQueryToConfig } from './pagination-query-to-config';

describe('pagination query to config', () => {
  it('paginationQueryToConfig', () => {
    const config = paginationQueryToConfig({
      limit: 10,
      page: 2,
      order: {
        name: Order.ASC,
      },
    });

    expect(config).toStrictEqual({
      take: 10,
      skip: 10,
      order: { name: 'ASC' },
    });
  });
});
