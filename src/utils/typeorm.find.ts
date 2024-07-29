import dayjs from 'dayjs';
import { isDateString } from 'class-validator';
import intersection from 'lodash/intersection';
import {
  FindManyOptions,
  FindOptionsWhere,
  IsNull,
  ILike,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
  Between,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  getMetadataArgsStorage,
  EntityTarget,
} from 'typeorm';

export class TypeOrmFind {
  private static findOrder = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): SelectQueryBuilder<Entity> => {
    const { order: orderBy, select, ...data } = find;
    let { relations, loadEagerRelations } = find;
    const columns = repository.metadata.ownColumns;
    const qb = repository.createQueryBuilder();
    if (select && relations) {
      if (Array.isArray(relations)) {
        relations = intersection(select as string[], relations);
      } else {
        relations = intersection(select as string[], Object.keys(relations));
      }
      loadEagerRelations = false;
    }
    qb.setFindOptions({
      ...data,
      ...orderBy,
      select,
      relations,
      loadEagerRelations,
    });
    if (orderBy) {
      Object.entries(orderBy).forEach(([field, direction]) => {
        const column = columns.find(
          (value) => value.databaseName === field,
        )?.type;
        const d = direction === 'DESC' ? 'DESC' : 'ASC';
        // TODO: эх... разобраться с relations:  || (find.relations && (find.take || find.skip))
        if (
          column !== 'string' ||
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
    return qb;
  };

  static countCI = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): Promise<number> => {
    const qb = this.findOrder(repository, find);
    return qb.getCount();
  };

  static findCI = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): Promise<Entity[]> => {
    const qb = this.findOrder(repository, find);
    return qb.getMany();
  };

  static findOneCI = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): Promise<Entity | null> => {
    const qb = this.findOrder(repository, find);
    return qb.getOne();
  };

  static findAndCountCI = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): Promise<[Entity[], number]> => {
    const qb = this.findOrder(repository, find);
    return qb.getManyAndCount();
  };

  static findParams = <Entity extends ObjectLiteral = ObjectLiteral>(
    entityClass: EntityTarget<Entity>,
    find: FindManyOptions<Entity>,
  ): FindManyOptions<Entity> =>
    find.where
      ? { ...find, where: TypeOrmFind.where(entityClass, find.where) }
      : find;

  static where = <
    Entity extends ObjectLiteral = ObjectLiteral,
    OriginalEntity extends ObjectLiteral = ObjectLiteral,
  >(
    entityClass: EntityTarget<OriginalEntity>,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): FindOptionsWhere<OriginalEntity> | FindOptionsWhere<OriginalEntity>[] => {
    const enumColumns = getMetadataArgsStorage().columns.filter(
      (value) => value.options.type === 'enum',
    );
    if (Array.isArray(where)) {
      const whereIsNull = where.map((whereField) =>
        Object.entries(whereField).reduce(
          (accWhere, [field, value]) => {
            if (field === 'dateWhenApp') {
              return accWhere;
            }
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
              if (value.length === 1 && isDateString(value[0])) {
                return {
                  ...accWhere,
                  [field]: Between(
                    dayjs(value[0]).startOf('day').toDate(),
                    dayjs(value[0]).endOf('day').toDate(),
                  ),
                };
              }
              if (
                enumColumns.filter((v) => v.propertyName === field).length > 0
              ) {
                return { ...accWhere, [field]: In(value) };
              }
              return { ...accWhere, [field]: Between(value[0], value[1]) };
            }
            if (isDateString(value)) {
              return {
                ...accWhere,
                [field]: Between(
                  dayjs(value).startOf('day').toDate(),
                  dayjs(value).endOf('day').toDate(),
                ),
              };
            }
            if (typeof value === 'string' && /^>=/.test(value)) {
              return { ...accWhere, [field]: MoreThanOrEqual(value.slice(2)) };
            }
            if (typeof value === 'string' && /^<=/.test(value)) {
              return { ...accWhere, [field]: LessThanOrEqual(value.slice(2)) };
            }
            if (typeof value === 'string' && /^>/.test(value)) {
              return { ...accWhere, [field]: MoreThanOrEqual(value.slice(1)) };
            }
            if (typeof value === 'string' && /^</.test(value)) {
              return { ...accWhere, [field]: MoreThanOrEqual(value.slice(1)) };
            }
            if (typeof value !== 'undefined') {
              return { ...accWhere, [field]: value };
            }
            return accWhere;
          },
          {} as Record<string, any>,
        ),
      );
      return whereIsNull as FindOptionsWhere<OriginalEntity>[];
    }

    const whereIsNull = where
      ? Object.entries(where).reduce(
          (accWhere, [field, value]) => {
            if (field === 'dateWhenApp') {
              return accWhere;
            }
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
              if (value.length === 1 && isDateString(value[0])) {
                return {
                  ...accWhere,
                  [field]: Between(
                    dayjs(value[0]).startOf('day').toDate(),
                    dayjs(value[0]).endOf('day').toDate(),
                  ),
                };
              }
              if (
                enumColumns.filter((v) => v.propertyName === field).length > 0
              ) {
                return { ...accWhere, [field]: In(value) };
              }
              return { ...accWhere, [field]: Between(value[0], value[1]) };
            }
            if (isDateString(value)) {
              return {
                ...accWhere,
                [field]: Between(
                  dayjs(value).startOf('day').toDate(),
                  dayjs(value).endOf('day').toDate(),
                ),
              };
            }
            if (typeof value === 'string' && /^>=/.test(value)) {
              return { ...accWhere, [field]: MoreThanOrEqual(value.slice(2)) };
            }
            if (typeof value === 'string' && /^<=/.test(value)) {
              return { ...accWhere, [field]: LessThanOrEqual(value.slice(2)) };
            }
            if (typeof value === 'string' && /^>/.test(value)) {
              return { ...accWhere, [field]: MoreThanOrEqual(value.slice(1)) };
            }
            if (typeof value === 'string' && /^</.test(value)) {
              return { ...accWhere, [field]: MoreThanOrEqual(value.slice(1)) };
            }
            if (typeof value !== 'undefined') {
              return { ...accWhere, [field]: value };
            }
            return accWhere;
          },
          {} as Record<string, any>,
        )
      : {};
    return whereIsNull as FindOptionsWhere<OriginalEntity>;
  };
}
