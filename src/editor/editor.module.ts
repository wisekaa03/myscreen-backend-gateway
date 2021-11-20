import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EditorEntity } from './editor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EditorEntity])],
  providers: [Logger],
})
export class EditorModule {}
