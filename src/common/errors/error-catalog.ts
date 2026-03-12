import { HttpStatus } from '@nestjs/common';

export interface ErrorDefinition {
  code: string;
  message: string;
  httpStatus: HttpStatus;
}

export const ClientErrors = {
  CLIENT_ALREADY_EXISTS: {
    code: 'CLIENT_ALREADY_EXISTS',
    message: 'Client already exists',
    httpStatus: HttpStatus.CONFLICT,
  },
  CLIENT_NOT_FOUND: {
    code: 'CLIENT_NOT_FOUND',
    message: 'Client was not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  INVALID_CLIENT_PHONE: {
    code: 'INVALID_CLIENT_PHONE',
    message: 'Client phone is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INVALID_CLIENT_DOCUMENT: {
    code: 'INVALID_CLIENT_DOCUMENT',
    message: 'Client document is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
} as const satisfies Record<string, ErrorDefinition>;

export const CommonErrors = {
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  DATABASE_UNIQUE_CONSTRAINT: {
    code: 'DATABASE_UNIQUE_CONSTRAINT',
    message: 'Database unique constraint violated',
    httpStatus: HttpStatus.CONFLICT,
  },
  DATABASE_FOREIGN_KEY_CONSTRAINT: {
    code: 'DATABASE_FOREIGN_KEY_CONSTRAINT',
    message: 'Database foreign key constraint violated',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  DATABASE_INVALID_QUERY: {
    code: 'DATABASE_INVALID_QUERY',
    message: 'Database query is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  DATABASE_UNAVAILABLE: {
    code: 'DATABASE_UNAVAILABLE',
    message: 'Database is unavailable',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
  },
} as const satisfies Record<string, ErrorDefinition>;

export const AccountErrors = {
  ACCOUNT_ALREADY_EXISTS: {
    code: 'ACCOUNT_ALREADY_EXISTS',
    message: 'Account already exists',
    httpStatus: HttpStatus.CONFLICT,
  },
  ACCOUNT_NOT_FOUND: {
    code: 'ACCOUNT_NOT_FOUND',
    message: 'Account was not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  INVALID_ACCOUNT_NUMBER: {
    code: 'INVALID_ACCOUNT_NUMBER',
    message: 'Account number is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INSUFFICIENT_ACCOUNT_FUNDS: {
    code: 'INSUFFICIENT_ACCOUNT_FUNDS',
    message: 'Account balance is insufficient',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
} as const satisfies Record<string, ErrorDefinition>;

export const TransactionErrors = {
  TRANSACTION_ALREADY_EXISTS: {
    code: 'TRANSACTION_ALREADY_EXISTS',
    message: 'Transaction already exists',
    httpStatus: HttpStatus.CONFLICT,
  },
  TRANSACTION_NOT_FOUND: {
    code: 'TRANSACTION_NOT_FOUND',
    message: 'Transaction was not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  INVALID_TRANSACTION_REFERENCE: {
    code: 'INVALID_TRANSACTION_REFERENCE',
    message: 'Transaction reference is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INVALID_TRANSACTION_AMOUNT: {
    code: 'INVALID_TRANSACTION_AMOUNT',
    message: 'Transaction amount is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INVALID_TRANSACTION_ACCOUNTS: {
    code: 'INVALID_TRANSACTION_ACCOUNTS',
    message: 'Transaction accounts are invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INVALID_TRANSACTION_STATE: {
    code: 'INVALID_TRANSACTION_STATE',
    message: 'Transaction state transition is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
} as const satisfies Record<string, ErrorDefinition>;

export const ExchangeErrors = {
  EXCHANGE_RATE_ALREADY_EXISTS: {
    code: 'EXCHANGE_RATE_ALREADY_EXISTS',
    message: 'Exchange rate already exists',
    httpStatus: HttpStatus.CONFLICT,
  },
  EXCHANGE_RATE_NOT_FOUND: {
    code: 'EXCHANGE_RATE_NOT_FOUND',
    message: 'Exchange rate was not found',
    httpStatus: HttpStatus.NOT_FOUND,
  },
  INVALID_EXCHANGE_RATE: {
    code: 'INVALID_EXCHANGE_RATE',
    message: 'Exchange rate is invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
  INVALID_EXCHANGE_CURRENCIES: {
    code: 'INVALID_EXCHANGE_CURRENCIES',
    message: 'Exchange currencies are invalid',
    httpStatus: HttpStatus.BAD_REQUEST,
  },
} as const satisfies Record<string, ErrorDefinition>;

export const ErrorCatalog = {
  ...ClientErrors,
  ...CommonErrors,
  ...AccountErrors,
  ...TransactionErrors,
  ...ExchangeErrors,
} as const;

export type ErrorCatalogKey = keyof typeof ErrorCatalog;
