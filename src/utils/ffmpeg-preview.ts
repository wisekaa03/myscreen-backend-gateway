import { join as pathJoin, parse as pathParse } from 'node:path';
import { readFile } from 'node:fs/promises';
import { rimraf } from 'rimraf';
import { Logger } from '@nestjs/common';
import Ffmpeg from 'fluent-ffmpeg';

import { FileType } from '@/enums/file-type.enum';

const previewWidth = 100;
const previewHeight = '?';
const logger = new Logger('FfMpeg');

export async function FfMpegPreview(
  type: FileType,
  inputFile: string,
): Promise<Buffer> {
  const { dir, name, ext } = pathParse(inputFile);
  const outputFile = pathJoin(dir, `${name}-preview${ext}`);

  if (type === FileType.IMAGE) {
    await new Promise((resolve, reject) => {
      process.env['FFREPORT'] = `file=${pathJoin(dir, `${name}-%t.log`)}`;
      Ffmpeg()
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
        .output(outputFile)
        .on('error', (error: Error) => {
          logger.error(error.message, error.stack);
          reject(error);
        })
        .on('end', resolve)
        .run();
    });
  }

  if (type === FileType.VIDEO) {
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
          Ffmpeg()
            .input(outPattern)
            .format('webm')
            .outputFps(3)
            .videoFilters([{ filter: 'loop', options: { loop: 10, size: 10 } }])
            .output(outputFile)
            .outputOptions([
              '-hide_banner',
              '-loglevel fatal',
              // '-loglevel debug', `-report`
            ])
            .on('error', reject)
            .on('end', () => {
              rimraf(pathJoin(dir, `${name}-preview-??.jpg`), { glob: true });
              resolve();
            })
            .run();
        });
    });
  }

  const buffer = await readFile(outputFile);

  rimraf(pathJoin(dir, `${name}-preview.jpg`));

  return buffer;
}
