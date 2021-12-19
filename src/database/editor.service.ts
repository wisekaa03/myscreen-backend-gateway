import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { EditorEntity } from './editor.entity';

import { UserEntity } from './user.entity';

@Injectable()
export class EditorService {
  constructor(
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
  ) {}

  find = async (
    find: FindManyOptions<EditorEntity>,
  ): Promise<[Array<EditorEntity>, number]> =>
    this.editorRepository.findAndCount(find);

  findOne = async (
    find: FindManyOptions<EditorEntity>,
  ): Promise<EditorEntity | undefined> => this.editorRepository.findOne(find);

  async create(
    user: UserEntity,
    update: Partial<EditorEntity>,
  ): Promise<EditorEntity> {
    const order: DeepPartial<EditorEntity> = {
      ...update,
      userId: user.id,
    };

    return this.editorRepository.save(this.editorRepository.create(order));
  }
}
