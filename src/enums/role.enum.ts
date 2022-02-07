export enum UserRoleEnum {
  Monitor = 'monitor',
  MonitorOwner = 'monitor-owner',
  Advertiser = 'advertiser',
  Administrator = 'administrator',
}

export const UserRole = Object.values(UserRoleEnum).filter(
  (role) =>
    role !== UserRoleEnum.Monitor && role !== UserRoleEnum.Administrator,
);
