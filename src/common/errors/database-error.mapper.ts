import { AppException } from './app.exception';

const UNIQUE_VIOLATION_CODES = new Set(['23505']);
const FOREIGN_KEY_VIOLATION_CODES = new Set(['23503']);
const INVALID_QUERY_CODES = new Set(['22P02', '23502', '23514']);
const UNAVAILABLE_CODES = new Set([
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '57P01',
  '57P02',
  '57P03',
  'ECONNREFUSED',
  'ETIMEDOUT',
]);

type DatabaseErrorShape = {
  code?: string;
  message?: string;
  detail?: string;
  driverError?: {
    code?: string;
    message?: string;
    detail?: string;
  };
};

export function mapDatabaseError(error: unknown): AppException {
  const databaseError = error as DatabaseErrorShape | undefined;
  const code = databaseError?.driverError?.code ?? databaseError?.code;
  const message = [
    databaseError?.message,
    databaseError?.detail,
    databaseError?.driverError?.message,
    databaseError?.driverError?.detail,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase();

  if (code && UNIQUE_VIOLATION_CODES.has(code)) {
    return new AppException('DATABASE_UNIQUE_CONSTRAINT');
  }

  if (code && FOREIGN_KEY_VIOLATION_CODES.has(code)) {
    return new AppException('DATABASE_FOREIGN_KEY_CONSTRAINT');
  }

  if (
    (code && INVALID_QUERY_CODES.has(code)) ||
    message.includes('invalid input syntax') ||
    message.includes('null value in column') ||
    message.includes('violates check constraint')
  ) {
    return new AppException('DATABASE_INVALID_QUERY');
  }

  if (
    (code && UNAVAILABLE_CODES.has(code)) ||
    message.includes('econnrefused') ||
    message.includes('connection terminated') ||
    message.includes('failed to connect') ||
    message.includes('timeout expired')
  ) {
    return new AppException('DATABASE_UNAVAILABLE');
  }

  return new AppException('INTERNAL_ERROR');
}
