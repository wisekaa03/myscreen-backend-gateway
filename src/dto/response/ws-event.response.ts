import { ApiProperty } from '@nestjs/swagger';
import { WsEvent } from '@/enums/ws-event.enum';

export class WsEventClass {
  @ApiProperty({ enum: WsEvent, enumName: 'WsEvent', required: false })
  WsEvent?: WsEvent;
}
