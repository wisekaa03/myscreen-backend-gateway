import type { S3ServiceException } from '@aws-sdk/client-s3';

export function isAWSError(error: unknown): error is S3ServiceException {
  return (
    !!(error as S3ServiceException).$response &&
    !!(error as S3ServiceException).$metadata &&
    !!(error as S3ServiceException).$fault
  );
}
