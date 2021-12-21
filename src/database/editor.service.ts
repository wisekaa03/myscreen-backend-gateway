import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { UserEntity } from './user.entity';
import { EditorEntity } from './editor.entity';

@Injectable()
export class EditorService {
  constructor(
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
  ) {}

  find = async (
    find: FindManyOptions<EditorEntity>,
  ): Promise<[Array<EditorEntity>, number]> =>
    this.editorRepository.findAndCount({
      ...find,
      relations: ['videoLayers', 'audioLayers'],
    });

  findOne = async (
    find: FindManyOptions<EditorEntity>,
  ): Promise<EditorEntity | undefined> =>
    this.editorRepository.findOne({
      ...find,
      relations: ['videoLayers', 'audioLayers'],
    });

  async update(
    user: UserEntity,
    update: Partial<EditorEntity>,
  ): Promise<EditorEntity> {
    const order: DeepPartial<EditorEntity> = {
      ...update,
      userId: user.id,
    };

    return this.editorRepository.save(this.editorRepository.create(order));
  }

  delete = async (
    user: UserEntity,
    editor: EditorEntity,
  ): Promise<DeleteResult> =>
    this.editorRepository.delete({
      id: editor.id,
      userId: user.id,
    });
}
