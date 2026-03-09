import { DataSource } from 'typeorm';
import { typeOrmConfig } from './typeorm.options';

export default new DataSource(typeOrmConfig);
