import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FileEntity } from './file.entity';
import { FolderEntity } from './folder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity, FolderEntity])],
  providers: [Logger],
})
export class FileModule {}
