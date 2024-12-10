import { join as pathJoin, parse as pathParse } from 'node:path';
import { Writable } from 'node:stream';
import { rimraf } from 'rimraf';
import Ffmpeg from 'fluent-ffmpeg';

import { FileType } from '@/enums/file-type.enum';
import { stream2buffer } from './stream2buffer';

const previewWidth = 100;
const previewHeight = '?';

export async function FfMpegPreview(
  type: FileType,
  inputFile: string,
): Promise<Buffer> {
  const { dir, name } = pathParse(inputFile);
  let ffmpegStream: Writable = new Writable();

  switch (type) {
    case FileType.IMAGE: {
      await new Promise((resolve, reject) => {
        process.env['FFREPORT'] = `file=${pathJoin(dir, `${name}-%t.log`)}`;
        ffmpegStream = Ffmpeg()
          .input(inputFile)
          .videoCodec('mjpeg')
          .outputFormat('mjpeg')
          .noAudio()
          .size(`${previewWidth}x${previewHeight}`)
          .outputOptions([
            '-q:v 100',
            '-hide_banner',
            '-loglevel fatal',
            // '-loglevel debug',
            // '-report',
          ])
          .on('error', reject)
          .on('end', resolve)
          .pipe();
      });

      break;
    }

    case FileType.VIDEO: {
      const outPattern = pathJoin(dir, `${name}-preview-%02d.jpg`);
      await new Promise<void>((resolve, reject) => {
        process.env['FFREPORT'] = `file=${pathJoin(dir, `${name}-%t.log`)}`;
        Ffmpeg()
          .input(inputFile)
          .thumbnails({
            folder: dir,
            filename: '%b-preview-%0i.jpg',
            count: 10,
            size: `${previewWidth}x${previewHeight}`,
          })
          .on('error', reject)
          .on('end', () => {
            ffmpegStream = Ffmpeg()
              .input(outPattern)
              .format('webm')
              .outputFps(3)
              .videoFilters([
                { filter: 'loop', options: { loop: 10, size: 10 } },
              ])
              .outputOptions([
                '-hide_banner',
                '-loglevel fatal',
                // '-loglevel debug',
                // `-report`,
              ])
              .on('error', reject)
              .on('end', () => {
                rimraf(pathJoin(dir, `${name}-preview-??.jpg`), { glob: true });
                resolve();
              })
              .pipe();
          });
      });

      break;
    }

    default: {
      return Buffer.from([]);
    }
  }

  return stream2buffer(ffmpegStream);
}
