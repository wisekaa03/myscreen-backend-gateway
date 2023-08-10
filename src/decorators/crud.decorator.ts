import { SetMetadata } from '@nestjs/common';
import { CRUD } from '@/enums';

export const CRUD_METADATA = '__crud__';

export const Crud = (crud: CRUD) => SetMetadata(CRUD_METADATA, crud);
