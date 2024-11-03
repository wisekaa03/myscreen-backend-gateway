export enum MsvcMailService {
  BidWarning = 'mail_sendBidWarningMessage',
  InvoicePayed = 'mail_invoicePayed',
  InvoiceAwaitingConfirmation = 'mail_invoiceAwaitingConfirmation',
  InvoiceConfirmed = 'mail_invoiceConfirmed',
  SendWelcome = 'mail_sendWelcomeMessage',
  SendVerificationCode = 'mail_sendVerificationCode',
  ForgotPassword = 'mail_forgotPassword',
  BalanceChanged = 'mail_balanceChanged',
  BalanceNotChanged = 'mail_balanceNotChanged',
  Verify = 'mail_verify',
}

export enum MsvcFormService {
  Invoice = 'form_invoice',
  ReportDeviceStatus = 'form_reportDeviceStatus',
  ReportViews = 'form_reportViews',
}

export enum MsvcEditor {
  Export = 'editor_export',
}

export enum MsvcGateway {
  Update = 'gateway_update',
  FileUpload = 'gateway_file_upload',
  EditorExportFinished = 'gateway_export_finished',
}
