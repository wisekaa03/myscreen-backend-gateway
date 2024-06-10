import fs from 'node:fs/promises';

export async function fileExist(path: string): Promise<boolean> {
  try {
      return (await fs.stat(path)).isFile();
  } catch (e) {
      return false;
  }
}