import { Logger } from '@nestjs/common';
import {
  FindManyOptions,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

export class TypeOrmFind {
  private static findOrder = <Entity extends ObjectLiteral>(
    repository: Repository<Entity>,
    find: FindManyOptions<Entity>,
  ): SelectQueryBuilder<Entity> => {
    const { order: orderBy, ...withoutOrder } = find;
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
}
