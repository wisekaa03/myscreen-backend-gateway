const ONE_GB_IN_BYTES = 1073741824;
const TEN_GB_IN_BYTES = 10 * ONE_GB_IN_BYTES;

export enum UserStoreSpaceEnum {
  DEMO = ONE_GB_IN_BYTES,
  FULL = TEN_GB_IN_BYTES,
  VIP = Infinity,
}
