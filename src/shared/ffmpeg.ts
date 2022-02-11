import child from 'node:child_process';
import util from 'node:util';
import path from 'node:path';

import { MediaMeta } from '@/database/file.entity';
import { VideoType } from '@/enums';

const exec = util.promisify(child.exec);

export async function FfMpegPreview(
  type: VideoType,
  meta: MediaMeta,
  filename: string,
  outPath: string,
): Promise<{ stderr: string; stdout: string }> {
  if (type === VideoType.Image) {
    return exec(
      `node_modules/ffmpeg-static/ffmpeg -i "${filename}" -v error` +
        ` -vf scale="100:74" -y "${outPath}"`,
    );
  }

  if (type === VideoType.Video) {
    const duration = Math.floor(meta.duration || 0);
    const frameInterval = Math.floor(duration / 6); // 6 - Number of frames
    const filenameParsed = path.parse(filename);
    const outPattern = path.join(
      filenameParsed.dir,
      `${filenameParsed.name}-preview-%04d.jpg`,
    );

    await exec(
      `node_modules/ffmpeg-static/ffmpeg -i "${filename}" -v error` +
        ' -an' +
        ` -vf scale="100:74",fps="1/${frameInterval}"` +
        ` -y "${outPattern}"`,
    );

    return exec(
      `node_modules/ffmpeg-static/ffmpeg -framerate 1/0.6 -i "${outPattern}" -v error -y "${outPath}"`,
    );
  }

  return { stderr: 'Unimplemented', stdout: '' };
}
