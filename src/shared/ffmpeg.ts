import child from 'node:child_process';
import util from 'node:util';
import path from 'node:path';
import { Logger } from '@nestjs/common';

import { MediaMeta } from '@/database/file.entity';
import { VideoType } from '@/enums';

const exec = util.promisify(child.exec);

export async function FfMpegPreview(
  type: VideoType,
  meta: MediaMeta,
  filename: string,
  outPath: string,
): Promise<void> {
  const logger = new Logger('FFMpeg');
  if (type === VideoType.Image) {
    await exec(
      `node_modules/ffmpeg-static/ffmpeg -i "${filename}" -q:v 10 -hide_banner -vcodec mjpeg -v error` +
        ` -vf scale="100:74" -y "${outPath}"`,
    ).catch((reason: unknown) => {
      logger.error(`FfMpeg: ${reason}`);
      throw reason;
    });
  }

  if (type === VideoType.Video) {
    const duration = Math.floor(meta?.duration || 0);
    const frameInterval = Math.floor(duration / 6) || 1; // 6 - Number of frames
    const filenameParsed = path.parse(filename);
    const outPattern = path.join(
      filenameParsed.dir,
      `${filenameParsed.name}-preview-%02d.jpg`,
    );

    await exec(
      `node_modules/ffmpeg-static/ffmpeg -i "${filename}" -q:v 10 -hide_banner -vcodec mjpeg -v error` +
        ' -an' +
        ` -vf scale="100:74",fps="1/${frameInterval}"` +
        ` -y "${outPattern}"`,
    ).catch((reason: unknown) => {
      logger.error(`FfMpeg: ${reason}`);
      throw reason;
    });

    await exec(
      `node_modules/ffmpeg-static/ffmpeg -framerate 1/0.6 -i "${outPattern}" -q:v 10 -v error -y "${outPath}"`,
    ).catch((reason: unknown) => {
      logger.error(`FfMpeg: ${reason}`);
      throw reason;
    });
  }
}
