import { OmitType } from '@nestjs/swagger';
import { FindOptionsSelect } from 'typeorm';

import { UserSizeEntity } from '../../database/user.view.entity';

export const selectUserOptions: FindOptionsSelect<UserSizeEntity> = {
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
  isDemoUser: true,
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

export class UserResponse extends OmitType(UserSizeEntity, [
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
  ...data
}: UserSizeEntity): UserSizeEntity => ({
  ...data,
  countUsedSpace: data.countUsedSpace ?? 0,
  countMonitors: data.countMonitors ?? 0,
  wallet: { total: parseFloat(walletSum ?? '0') ?? 0 },
});
