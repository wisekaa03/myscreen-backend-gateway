export const generateMailToken = (email: string, key: string) =>
  Buffer.from(`${email}|${key}`).toString('base64url');

export const decodeMailToken = (token: string) =>
  Buffer.from(token, 'base64url').toString('ascii').split('|');
