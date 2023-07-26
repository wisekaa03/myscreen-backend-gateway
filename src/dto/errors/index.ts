import { BadRequestError } from './bad-request.response';
import { ForbiddenError } from './forbidden.response';
import { ConflictError } from './conflict.response';
import { NotFoundError } from './not-found.response';
import { PreconditionFailedError } from './precondition.response';
import { UnauthorizedError } from './unauthorized.reponse';
import { InternalServerError } from './internal-server-error.response';
import { ServiceUnavailableError } from './service-unavailable.response';
import { NotImplementedError } from './not-implemented-error.response';

export * from './bad-request.response';
export * from './forbidden.response';
export * from './conflict.response';
export * from './not-found.response';
export * from './precondition.response';
export * from './unauthorized.reponse';
export * from './internal-server-error.response';
export * from './service-unavailable.response';
export * from './not-implemented-error.response';

export type HttpError =
  | BadRequestError
  | ForbiddenError
  | InternalServerError
  | InternalServerError
  | ConflictError
  | InternalServerError
  | InternalServerError
  | NotFoundError
  | ServiceUnavailableError
  | PreconditionFailedError
  | UnauthorizedError
  | NotImplementedError;
