export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  TRANSFER = "transfer",
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum TransactionChannel {
  ATM = "atm",
  MOBILE = "mobile",
  WEB = "web",
  BRANCH = "branch",
  API = "api"
}

export enum TransactionEffectRole {
  SOURCE = 'SOURCE',
  DESTINATION = 'DESTINATION',
}

export enum TransactionEffectOperation {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export interface TransactionBalanceEffect {
  role: TransactionEffectRole;
  operation: TransactionEffectOperation;
  amount: number;
}
