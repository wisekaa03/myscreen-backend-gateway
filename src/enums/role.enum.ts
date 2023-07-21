export enum UserRoleEnum {
  Monitor = 'monitor',
  MonitorOwner = 'monitor-owner',
  Advertiser = 'advertiser',
  Administrator = 'administrator',
  Accountant = 'accountant',
}

export const UserRole = Object.values(UserRoleEnum).filter(
  (role) =>
    role !== UserRoleEnum.Monitor &&
    role !== UserRoleEnum.Administrator &&
    role !== UserRoleEnum.Accountant,
);
