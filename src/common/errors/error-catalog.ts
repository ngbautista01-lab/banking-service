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
} as const satisfies Record<string, ErrorDefinition>;

export const ErrorCatalog = {
  ...ClientErrors,
  ...CommonErrors,
} as const;

export type ErrorCatalogKey = keyof typeof ErrorCatalog;
