import { InvoiceEntity } from '../database/invoice.entity';

export const isInvoice = (invoice: any): invoice is InvoiceEntity => {
  return (
    typeof invoice === 'object' &&
    typeof invoice.id === 'string' &&
    typeof invoice.seqNo === 'number' &&
    typeof invoice.sum === 'string' &&
    typeof invoice.description === 'string' &&
    typeof invoice.user === 'object'
  );
};
