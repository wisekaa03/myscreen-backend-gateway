import { generateMailToken, decodeMailToken } from './mail-token';

describe('pagination query to config', () => {
  it('generateMailToken', () => {
    const token = generateMailToken('foo@bar.baz', 'token');
    expect(token).toBe('Zm9vQGJhci5iYXp8dG9rZW4');
  });

  it('decodeMailToken', () => {
    const [email, token] = decodeMailToken('Zm9vQGJhci5iYXp8dG9rZW4');
    expect(email).toBe('foo@bar.baz');
    expect(token).toBe('token');
  });
});
