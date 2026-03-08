import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockedClientStatus1700000000001 implements MigrationInterface {
  name = 'AddBlockedClientStatus1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE client_status_enum
      ADD VALUE IF NOT EXISTS 'BLOCKED';
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values safely in a simple down migration.
  }
}
