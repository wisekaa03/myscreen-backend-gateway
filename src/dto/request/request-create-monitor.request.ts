import { PickType } from '@nestjs/swagger';

import { RequestEntity } from '@/database/request.entity';

export class RequestCreateMonitorRequest extends PickType(RequestEntity, [
  'dateWhen',
  'dateBefore',
  'playlistChange',
]) {}
