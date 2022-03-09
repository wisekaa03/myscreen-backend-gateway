import { PartialType } from '@nestjs/swagger';

import { UserEntity } from '@/database/user.entity';

export class UserPartialRequest extends PartialType(UserEntity) {}
