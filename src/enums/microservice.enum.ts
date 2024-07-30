export enum MsvcMailService {
  BidWarning = 'sendBidWarningMessage',
  InvoicePayed = 'invoicePayed',
  InvoiceAwaitingConfirmation = 'invoiceAwaitingConfirmation',
  InvoiceConfirmed = 'invoiceConfirmed',
  SendWelcome = 'sendWelcomeMessage',
  SendVerificationCode = 'sendVerificationCode',
  ForgotPassword = 'forgotPassword',
  BalanceChanged = 'balanceChanged',
  BalanceNotChanged = 'balanceNotChanged',
  Verify = 'verify',
}

export enum MsvcFormService {
  Invoice = 'invoice',
  ReportDeviceStatus = 'reportDeviceStatus',
  ReportViews = 'reportViews',
}

export enum MsvcEditor {
  Export = 'export',
}

export enum MsvcGateway {
  Update = 'update',
  FileUpload = 'file_upload',
  EditorFile = 'editor_file',
}
