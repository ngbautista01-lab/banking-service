import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoMigration1773064749883 implements MigrationInterface {
  name = 'AutoMigration1773064749883';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."clients_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "first_name" character varying(80) NOT NULL,
        "last_name" character varying(80) NOT NULL,
        "email" character varying(120) NOT NULL,
        "document_number" character varying(25) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "status" "public"."clients_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_clients_email" UNIQUE ("email"),
        CONSTRAINT "UQ_clients_document_number" UNIQUE ("document_number"),
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE TYPE "public"."accounts_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."accounts_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "account_number" character varying(30) NOT NULL,
        "alias" character varying(80) NOT NULL,
        "currency" "public"."accounts_currency_enum" NOT NULL,
        "balance" numeric(14,2) NOT NULL DEFAULT '0',
        "status" "public"."accounts_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_accounts_account_number" UNIQUE ("account_number"),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accounts_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."accounts_currency_enum"`);
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TYPE "public"."clients_status_enum"`);
  }
}
