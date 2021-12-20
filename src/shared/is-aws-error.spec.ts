import { isAWSError } from './is-aws-error';

describe('isAWSError', () => {
  it('isAWSError: false', () => {
    expect(isAWSError(new Error())).toBe(false);
  });

  it('isAWSError: true', () => {
    expect(
      isAWSError({
        region: 'us-east-1',
        code: 200,
        retryDelay: 10,
      }),
    ).toBe(true);
  });
});
