import { OmitType } from '@nestjs/swagger';
import { FindOptionsSelect } from 'typeorm';

import { UserEntity } from '../../database/user.entity';
import { UserSizeEntity } from '../../database/user.view.entity';

export const selectUserOptions: FindOptionsSelect<UserEntity> = {
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
  ...data
}: UserEntity & Partial<UserSizeEntity>): Partial<UserEntity> &
  Partial<UserSizeEntity> => ({
  ...data,
  countUsedSpace: data.countUsedSpace || 0,
  countMonitors: data.countMonitors || 0,
  wallet: { total: data.walletSum || 0 },
});
