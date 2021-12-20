import { genKey } from './genKey';

describe('genKey', () => {
  it('genKey result', () => {
    expect(genKey()).toHaveLength(11);
  });
});
