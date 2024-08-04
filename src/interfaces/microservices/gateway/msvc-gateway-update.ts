import {
  EntityTarget,
  FindOptionsWhere,
  ObjectId,
  ObjectLiteral,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export interface MsvcGatewayUpdate<Entity extends ObjectLiteral> {
  entity: EntityTarget<Entity>;
  criteria:
    | string
    | string[]
    | number
    | number[]
    | Date
    | Date[]
    | ObjectId
    | ObjectId[]
    | FindOptionsWhere<Entity>;
  column: QueryDeepPartialEntity<Entity>;
}
