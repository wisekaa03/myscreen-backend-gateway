import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export const validationPipeOptions = () =>
  new ValidationPipe({
    whitelist: true,
    skipUndefinedProperties: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    stopAtFirstError: false,
    exceptionFactory: (errors: ValidationError[]) => {
      const message = errors
        .map((error) => {
          let ret: Array<string> =
            (error.constraints && Object.values(error.constraints)) || [];
          if (error.children && error.children.length > 0) {
            ret = [
              ...ret,
              error.children
                .map(
                  (child) =>
                    child.constraints && Object.values(child.constraints),
                )
                .join(', '),
            ];
          }
          return ret;
        })
        .join(', ');
      return new BadRequestException(message);
    },
  });
