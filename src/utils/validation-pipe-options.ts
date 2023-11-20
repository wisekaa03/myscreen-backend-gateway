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
            const recurse = error.children
              .map((child) => {
                if (child.children && child.children.length > 0) {
                  return child.children
                    .map(
                      (childChild) =>
                        childChild.constraints &&
                        Object.values(childChild.constraints),
                    )
                    .join(', ');
                }
                return child.constraints && Object.values(child.constraints);
              })
              .join(', ');
            ret = [...ret, recurse];
          }
          return ret;
        })
        .join(', ');
      return new BadRequestException(message);
    },
  });
