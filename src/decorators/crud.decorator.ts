import { Reflector } from '@nestjs/core';
import { CRUD } from '@/enums/crud.enum';

export const Crud = Reflector.createDecorator<CRUD>();
