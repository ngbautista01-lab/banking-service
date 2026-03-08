import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBankingSchema1700000000000 implements MigrationInterface {
  name = 'CreateBankingSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE client_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

      CREATE TABLE clients (
        id uuid PRIMARY KEY,
        first_name varchar(80) NOT NULL,
        last_name varchar(80) NOT NULL,
        email varchar(120) NOT NULL UNIQUE,
        document_number varchar(25) NOT NULL UNIQUE,
        phone varchar(20) NOT NULL,
        status client_status_enum NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS clients;
      DROP TYPE IF EXISTS client_status_enum;
    `);
  }
}
