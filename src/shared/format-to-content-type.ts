import { SpecificFormat } from '../enums/specific-format.enum';

export const formatToContentType: Record<SpecificFormat, string> = {
  [SpecificFormat.PDF]: 'application/pdf',
  [SpecificFormat.XLSX]: 'application/vnd.ms-excel',
};
