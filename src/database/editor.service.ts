import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { EditorEntity } from './editor.entity';

import { UserEntity } from './user.entity';

@Injectable()
export class EditorService {
  constructor(
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
    private readonly configService: ConfigService,
  ) {}

  find = async (
    find: FindManyOptions<EditorEntity>,
  ): Promise<[Array<EditorEntity>, number]> =>
    this.editorRepository.findAndCount(find);

  findOne = async (
    find: FindManyOptions<EditorEntity>,
  ): Promise<EditorEntity | undefined> => this.editorRepository.findOne(find);

  async create(user: UserEntity): Promise<EditorEntity> {
    const order: DeepPartial<EditorEntity> = {
      user,
    };

    return this.editorRepository.save(this.editorRepository.create(order));
  }
}
