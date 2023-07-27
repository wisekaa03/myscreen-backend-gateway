export const getS3Name = (name: string) =>
  Buffer.from(name).toString('base64url');
