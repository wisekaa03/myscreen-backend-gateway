import { isAWSError } from './is-aws-error';

describe('isAWSError', () => {
  it('isAWSError: false', () => {
    expect(isAWSError(new Error())).toBe(false);
  });

  it('isAWSError: true', () => {
    expect(
      isAWSError({
        $response: 'us-east-1',
        $metadata: 200,
        $fault: 'Body message',
      }),
    ).toBe(true);
  });
});
