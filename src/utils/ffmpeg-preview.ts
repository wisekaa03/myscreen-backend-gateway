import child from 'node:child_process';
import util from 'node:util';
import path from 'node:path';
import { Logger } from '@nestjs/common';
import type { FfprobeData } from 'media-probe';

import { FileType } from '@/enums/file-type.enum';
import { fileExist } from './fs';

const exec = util.promisify(child.exec);

export async function FfMpegPreview(
  type: FileType,
  info: FfprobeData,
  filename: string,
  outPath: string,
): Promise<void> {
  const logger = new Logger('FfMpeg');

  const ffmpeg = (await fileExist('node_modules/ffmpeg-static/ffmpeg'))
    ? 'node_modules/ffmpeg-static/ffmpeg'
    : 'ffmpeg';

  if (type === FileType.IMAGE) {
    await exec(
      `${ffmpeg} -i "${filename}" -q:v 10 -hide_banner -vcodec mjpeg -v error` +
        ` -vf scale="100:74" -y "${outPath}"`,
    ).catch((error: unknown) => {
      logger.error('FfMpeg error', error);
      throw error;
    });
  }

  if (type === FileType.VIDEO) {
    const duration = Math.floor(info.format?.duration || 0);
    const frameInterval = Math.floor(duration / 6) || 1; // 6 - Number of frames
    const filenameParsed = path.parse(filename);
    const outPattern = path.join(
      filenameParsed.dir,
      `${filenameParsed.name}-preview-%02d.jpg`,
    );

    await exec(
      `${ffmpeg} -i "${filename}" -q:v 10 -hide_banner -vcodec mjpeg -v error` +
        ' -an' +
        ` -vf scale="100:74",fps="1/${frameInterval}"` +
        ` -y "${outPattern}"`,
    ).catch((error: unknown) => {
      logger.error('FfMpeg error', error);
      throw error;
    });

    await exec(
      `${ffmpeg} -framerate 1/0.6 -i "${outPattern}" -q:v 10 -v error -y "${outPath}"`,
    ).catch((error: unknown) => {
      logger.error('FfMpeg error', error);
      throw error;
    });
  }
}
