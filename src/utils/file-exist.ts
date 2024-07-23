import fs from 'node:fs';

export function fileExist(path: string): boolean {
  try {
    return fs.statSync(path).isFile();
  } catch (e: unknown) {
    return false;
  }
}
