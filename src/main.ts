import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from './common/errors/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(new Logger('BankingService'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  Logger.log(`HTTP server listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
