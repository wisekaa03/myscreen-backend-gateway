import { OmitType, PartialType } from '@nestjs/swagger';
import { CooperationEntity } from '@/database/cooperation.entity';

export class CooperationPartialRequest extends PartialType(
  OmitType(CooperationEntity, [
    'buyer',
    'seller',
    'monitor',
    'playlist',
    'user',
    'createdAt',
    'updatedAt',
  ]),
) {}
