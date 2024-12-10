import fs from 'node:fs';

export function dirExist(path: string): boolean {
  try {
    return fs.statSync(path).isDirectory();
  } catch (e: unknown) {
    return false;
  }
}
