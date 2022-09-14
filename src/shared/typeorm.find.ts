import { Logger } from '@nestjs/common';
import { isDateString } from 'class-validator';
import {
  FindManyOptions,
  FindOptionsWhere,
  IsNull,
  ILike,
  Equal,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
  Between,
  In,
} from 'typeorm';

export class TypeOrmFind {
  private static findOrder = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): SelectQueryBuilder<Entity> => {
    const { order: orderBy /* ...withoutOrder */ } = find;
    const qb = repository.createQueryBuilder();
    qb.setFindOptions(find);
    const columns = repository.metadata.ownColumns;
    if (orderBy) {
      Object.entries(orderBy).forEach(([field, direction]) => {
        const column = columns.find(
          (value) => value.databaseName === field,
        )?.type;
        const d = direction === 'DESC' ? 'DESC' : 'ASC';
        // TODO: эх... разобраться с relations:  || (find.relations && (find.take || find.skip))
        if (
          column !== String ||
          (find.relations &&
            ((Array.isArray(find.relations) && find.relations.length > 0) ||
              Object.keys(find.relations).length > 0) &&
            (find.take || find.skip))
        ) {
          qb.addOrderBy(`${qb.alias}.${field}`, d);
        } else {
          qb.addSelect(`LOWER(${qb.alias}.${field})`, `${field}_${d}`);
          qb.addOrderBy(`"${field}_${d}"`, d);
        }
      });
    }
    {
      const logger = new Logger('ORDER');
      logger.debug(qb.getSql());
    }
    return qb;
  };

  static findCI = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): Promise<Entity[]> => {
    const qb = this.findOrder(repository, find);
    return qb.getMany();
  };

  static findAndCountCI = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): Promise<[Entity[], number]> => {
    const qb = this.findOrder(repository, find);
    return Promise.all([qb.getMany(), qb.getCount()]);
  };

  static Nullable = <Entity extends ObjectLiteral>(
    find: FindManyOptions<Entity>,
  ): FindManyOptions<Entity> => {
    if (find.where) {
      const { where, ...data } = find;
      return {
        where: TypeOrmFind.#Where(where),
        ...data,
      };
    }
    return find;
  };

  static #Where = <Entity extends ObjectLiteral>(
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[] => {
    if (Array.isArray(where)) {
      const whereIsNull = where.map((whereField) =>
        Object.entries(whereField).reduce((accWhere, [field, value]) => {
          if (value === null) {
            return { ...accWhere, [field]: IsNull() };
          }
          if (typeof value === 'string' && /%/.test(value)) {
            return { ...accWhere, [field]: ILike(value) };
          }
          if (Array.isArray(value)) {
            if (
              value.length === 2 &&
              isDateString(value[0]) &&
              isDateString(value[1])
            ) {
              return { ...accWhere, [field]: Between(value[0], value[1]) };
            }
            return { ...accWhere, [field]: In(value) };
          }
          return { ...accWhere, [field]: value };
        }, {} as Record<string, any>),
      );
      return whereIsNull;
    }

    const whereIsNull = where
      ? Object.entries(where).reduce((accWhere, [field, value]) => {
          if (value === null) {
            return { ...accWhere, [field]: IsNull() };
          }
          if (typeof value === 'string' && /%/.test(value)) {
            return { ...accWhere, [field]: ILike(value) };
          }
          if (Array.isArray(value)) {
            if (
              value.length === 2 &&
              isDateString(value[0]) &&
              isDateString(value[1])
            ) {
              return { ...accWhere, [field]: Between(value[0], value[1]) };
            }
            return { ...accWhere, [field]: In(value) };
          }
          return { ...accWhere, [field]: value };
        }, {} as Record<string, any>)
      : {};
    return whereIsNull;
  };

  static Where = <Entity extends ObjectLiteral>(
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
    userId?: string,
  ): FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[] => {
    if (userId) {
      const whereIsNull = {
        ...TypeOrmFind.#Where(where),
        userId: Equal(userId),
      };
      return whereIsNull;
    }
    return TypeOrmFind.#Where(where);
  };
}
