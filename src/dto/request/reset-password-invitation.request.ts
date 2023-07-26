import { PickType } from '@nestjs/swagger';

import { UserEntity } from '@/database/user.entity';

export class ResetPasswordInvitationRequest extends PickType(UserEntity, [
  'email',
]) {}
