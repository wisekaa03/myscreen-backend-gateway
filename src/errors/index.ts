export interface HttpError {
  status: string;
  statusCode: number;
  name: string;
  code: string;
  message: string;
  [K: string]: any;
}

export * from './bad-request.response';
export * from './forbidden.response';
export * from './conflict.response';
export * from './not-found.response';
export * from './precondition.response';
export * from './unauthorized.reponse';
export * from './internal-server.response';
export * from './service-unavailable.response';
export * from './not-implemented.response';
export * from './not-acceptable.response';
