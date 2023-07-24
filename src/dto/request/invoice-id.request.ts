import { PickType } from '@nestjs/swagger';

import { InvoiceEntity } from '../../database/invoice.entity';

export class InvoiceIdRequest extends PickType(InvoiceEntity, ['id']) {}
