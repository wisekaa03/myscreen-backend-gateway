import child from 'node:child_process';
import util from 'node:util';
import type { FfprobeData } from 'media-probe';

import { VideoType } from '@/enums';

const exec = util.promisify(child.exec);

export async function FfMpegPreview(
  type: VideoType,
  media: FfprobeData,
  filename: string,
  outPath: string,
): Promise<{ stderr: string; stdout: string }> {
  if (type === VideoType.Image) {
    return exec(
      `node_modules/ffmpeg-static/ffmpeg -i ${filename} -v error` +
        ` -vf scale="100:74" -y ${outPath}`,
    );
  }

  if (type === VideoType.Video) {
    return exec(
      `node_modules/ffmpeg-static/ffmpeg -i ${filename} -v error` +
        ' -vframes 10' +
        ` -vf scale="100:74" -y ${outPath}`,
    );
  }

  return { stderr: 'Unimplemented', stdout: '' };
}
