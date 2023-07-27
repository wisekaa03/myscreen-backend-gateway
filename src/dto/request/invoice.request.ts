import { OmitType } from '@nestjs/swagger';

import { InvoiceEntity } from '@/database/invoice.entity';

export class InvoiceRequest extends OmitType(InvoiceEntity, []) {}
