import { SpecificFormat } from '@/enums/invoice-format.enum';

export const formatToContentType: Record<SpecificFormat, string> = {
  [SpecificFormat.PDF]: 'application/pdf',
  [SpecificFormat.XLSX]: 'application/vnd.ms-excel',
};
