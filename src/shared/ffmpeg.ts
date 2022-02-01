import child from 'node:child_process';
import util from 'node:util';

const exec = util.promisify(child.exec);

export async function FfMpegPreview(
  filename: string,
  outPath: string,
): Promise<{ stderr: string; stdout: string }> {
  return exec(
    `node_modules/ffmpeg-static/ffmpeg -i ${filename} -v error -vf scale="100:74" -y ${outPath}`,
  );
}
