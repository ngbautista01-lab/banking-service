import { AppDataSource } from '../infrastructure/database/typeorm.config';

async function bootstrap() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();

  await import('../main');
}

void bootstrap();
