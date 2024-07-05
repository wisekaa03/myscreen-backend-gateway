import { FileEntity } from '@/database/file.entity';

export const getS3Name = (name: string) =>
  Buffer.from(name).toString('base64url');

export const getS3FullName = ({ folderId, hash, name }: FileEntity) =>
  `${folderId}/${hash}-${getS3Name(name)}`;
