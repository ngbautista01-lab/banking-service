import { DataSource, DataSourceOptions } from 'typeorm';
import { ClientEntity } from '../../modules/clients/domain/client.entity';
import { CreateBankingSchema1700000000000 } from './migrations/1700000000000-CreateBankingSchema';
import { AddBlockedClientStatus1700000000001 } from './migrations/1700000000001-AddBlockedClientStatus';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'banking',
  entities: [ClientEntity],
  migrations: [
    CreateBankingSchema1700000000000,
    AddBlockedClientStatus1700000000001,
  ],
  synchronize: false,
  logging: false,
};

export const AppDataSource = new DataSource(typeOrmConfig);

export default AppDataSource;
