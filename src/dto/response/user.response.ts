import { OmitType } from '@nestjs/swagger';
import { FindOptionsSelect } from 'typeorm';

import { UserExtEntity } from '@/database/user-ext.entity';

export const selectUserOptions: FindOptionsSelect<UserExtEntity> = {
  id: true,
  email: true,
  disabled: true,
  surname: true,
  name: true,
  middleName: true,
  phoneNumber: true,
  city: true,
  country: true,
  storageSpace: true,
  plan: true,
  company: true,
  companyEmail: true,
  companyLegalAddress: true,
  companyPhone: true,
  companyPSRN: true,
  companyRRC: true,
  companyTIN: true,
  companyActualAddress: true,
  companyBank: true,
  companyBIC: true,
  companyCorrespondentAccount: true,
  companyPaymentAccount: true,
  role: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
  countUsedSpace: true,
  countMonitors: true,
  walletSum: true,
};

export class UserResponse extends OmitType(UserExtEntity, [
  'forgotConfirmKey',
  'emailConfirmKey',
  'password',
  'monitors',
]) {}

export const userEntityToUser = ({
  forgotConfirmKey,
  emailConfirmKey,
  password,
  monitors,
  walletSum,
  wallet,
  ...data
}: UserExtEntity): UserExtEntity => ({
  ...data,
  countUsedSpace: parseInt(`${data.countUsedSpace ?? 0}`, 10),
  countMonitors: parseInt(`${data.countMonitors ?? 0}`, 10),
  wallet: { total: wallet ? wallet.total : parseFloat(walletSum ?? '0') },
});
