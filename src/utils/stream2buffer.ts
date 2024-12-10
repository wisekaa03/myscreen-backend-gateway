import { Writable } from 'node:stream';

export function stream2buffer(out: Writable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const _buf: Buffer[] = [];
    out.on('data', (chunk) => _buf.push(chunk));
    out.on('end', () => resolve(Buffer.concat(_buf)));
    out.on('error', reject);
  });
}
