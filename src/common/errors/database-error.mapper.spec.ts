import { HttpStatus } from '@nestjs/common';
import { mapDatabaseError } from './database-error.mapper';

describe('mapDatabaseError', () => {
  it('maps unique constraint violations to conflict', () => {
    const exception = mapDatabaseError({
      driverError: { code: '23505' },
      message: 'duplicate key value violates unique constraint',
    });

    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.getResponse()).toEqual({
      code: 'DATABASE_UNIQUE_CONSTRAINT',
      message: 'Database unique constraint violated',
    });
  });

  it('maps foreign key violations to bad request', () => {
    const exception = mapDatabaseError({
      driverError: { code: '23503' },
      message: 'insert or update violates foreign key constraint',
    });

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.getResponse()).toEqual({
      code: 'DATABASE_FOREIGN_KEY_CONSTRAINT',
      message: 'Database foreign key constraint violated',
    });
  });

  it('maps invalid query payloads to bad request', () => {
    const exception = mapDatabaseError({
      driverError: { code: '22P02' },
      message: 'invalid input syntax for type uuid',
    });

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.getResponse()).toEqual({
      code: 'DATABASE_INVALID_QUERY',
      message: 'Database query is invalid',
    });
  });

  it('maps unavailable database errors to service unavailable', () => {
    const exception = mapDatabaseError({
      code: 'ECONNREFUSED',
      message: 'connect ECONNREFUSED 127.0.0.1:5432',
    });

    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.getResponse()).toEqual({
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database is unavailable',
    });
  });

  it('falls back to internal error for unknown database errors', () => {
    const exception = mapDatabaseError({
      message: 'unexpected database failure',
    });

    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.getResponse()).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });
});
