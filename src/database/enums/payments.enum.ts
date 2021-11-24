export enum PaymentService {
  Youkassa = 'youkassa',
  Invoice = 'invoice',
}

export enum PaymentStatus {
  Pending = 'pending',
  Succeded = 'succeeded',
  Cancelled = 'cancelled',
  WaitingForCapture = 'waiting_for_capture',
}

export enum PaymentReceiptStatus {
  Pending = 'pending',
  Succeeded = 'succeeded',
  Cancelled = 'cancelled',
}

export enum PaymentCancellationParty {
  YandexCheckout = 'yandex_checkout',
  YooMoney = 'yoo_money',
  PaymentNetwork = 'payment_network',
  Merchant = 'merchant',
}

export enum PaymentCancellationReason {
  ThreeDSecureFailed = '3d_secure_failed',
  CallIssuer = 'call_issuer',
  CancelledByMerchant = 'canceled_by_merchant',
  CardExpired = 'card_expired',
  CountryForbidden = 'country_forbidden',
  ExpiredOnCapture = 'expired_on_capture',
  ExpiredOnConfirmation = 'expired_on_confirmation',
  FraudSuspected = 'fraud_suspected',
  GeneralDecline = 'general_decline',
  IdentificationRequired = 'identification_required',
  InsufficientFunds = 'insufficient_funds',
  InternalTimeout = 'internal_timeout',
  InvalidCardNumber = 'invalid_card_number',
  InvalidCsc = 'invalid_csc',
  IssuerUnavailable = 'issuer_unavailable',
  PaymentMethodLimitExceeded = 'payment_method_limit_exceeded',
  PaymentMethodRestricted = 'payment_method_restricted',
  PermissionRevoked = 'permission_revoked',
  UnsupportedMobileOperator = 'unsupported_mobile_operator',
}
