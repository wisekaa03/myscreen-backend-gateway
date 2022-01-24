export enum UserRoleEnum {
  MonitorOwner = 'monitor-owner',
  Advertiser = 'advertiser',
  Administrator = 'administrator',
}

export const UserRole = Object.values(UserRoleEnum);
// .filter(
//   (user) => user !== UserRoleEnum.Administrator,
// );
