import { HttpException } from '@nestjs/common';
import { ErrorCatalog, ErrorCatalogKey } from './error-catalog';

export class AppException extends HttpException {
  readonly code: string;

  constructor(errorKey: ErrorCatalogKey) {
    const error = ErrorCatalog[errorKey];

    super(
      {
        code: error.code,
        message: error.message,
      },
      error.httpStatus,
    );

    this.code = error.code;
  }
}
