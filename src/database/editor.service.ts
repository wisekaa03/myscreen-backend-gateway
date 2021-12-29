import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { UserEntity } from './user.entity';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';

@Injectable()
export class EditorService {
  constructor(
    @InjectRepository(EditorEntity)
    private readonly editorRepository: Repository<EditorEntity>,
    @InjectRepository(EditorLayerEntity)
    private readonly editorLayerRepository: Repository<EditorLayerEntity>,
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

  findOneLayer = async (
    find: FindManyOptions<EditorLayerEntity>,
  ): Promise<EditorLayerEntity | undefined> =>
    this.editorLayerRepository.findOne({
      ...find,
      relations: ['videoLayers', 'audioLayers', 'file'],
    });

  /**
   * Update layer
   * @async
   * @param {UserEntity} user User entity
   * @param {number} id Editor entity id
   * @param {EditorLayerEntity} update Editor layer entity
   * @returns {EditorEntity} Result
   */
  async updateLayer(
    user: UserEntity,
    id: string,
    update: Partial<EditorLayerEntity>,
  ): Promise<EditorLayerEntity | undefined> {
    return this.editorLayerRepository.save(
      this.editorLayerRepository.create(update),
    );
  }

  deleteLayer = async (
    user: UserEntity,
    editorLayer: EditorLayerEntity,
  ): Promise<DeleteResult> =>
    this.editorLayerRepository.delete({
      id: editorLayer.id,
    });
}
