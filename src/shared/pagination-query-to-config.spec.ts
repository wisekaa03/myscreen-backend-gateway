import { paginationQueryToConfig } from './pagination-query-to-config';

describe('pagination query to config', () => {
  it('paginationQueryToConfig', () => {
    const config = paginationQueryToConfig({
      limit: 10,
      page: 1,
      order: { name: 'ASC' },
    });

    expect(config).toStrictEqual({ take: 10, skip: 0, order: { name: 'ASC' } });
  });
});
