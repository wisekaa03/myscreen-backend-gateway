import type { AWSError } from 'aws-sdk';

export function isAWSError(error: unknown): error is AWSError {
  return (
    !!(error as AWSError).region &&
    !!(error as AWSError).code &&
    !!(error as AWSError).message &&
    !!(error as AWSError).retryDelay
  );
}
