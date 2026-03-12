import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { TypeORMError } from 'typeorm';
import { AppException } from './app.exception';
import { mapDatabaseError } from './database-error.mapper';

@Catch(TypeORMError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: TypeORMError, host: ArgumentsHost): AppException | void {
    const mappedException = mapDatabaseError(exception);

    this.logger.error(exception.message, exception.stack);

    if (host.getType<GqlContextType>() === 'graphql') {
      return mappedException;
    }

    if (host.getType<'http'>() !== 'http') {
      throw mappedException;
    }

    const response = host.switchToHttp().getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = host.switchToHttp().getRequest<{ url?: string }>();
    const errorResponse = mappedException.getResponse() as {
      code: string;
      message: string;
    };
    const status = mappedException.getStatus();

    response.status(status).json({
      statusCode: status,
      code: errorResponse.code,
      message: errorResponse.message,
      path: request.url ?? '',
      timestamp: new Date().toISOString(),
    });
  }
}
