import { randomBytes } from 'crypto';

export const genKey = () => randomBytes(8).toString('base64url');
