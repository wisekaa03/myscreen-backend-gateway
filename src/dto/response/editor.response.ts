import { OmitType } from '@nestjs/swagger';
import { EditorEntity } from '@/database/editor.entity';

export class EditorResponse extends OmitType(EditorEntity, []) {}
