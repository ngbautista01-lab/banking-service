import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1773064749883 implements MigrationInterface {
    name = 'AutoMigration1773064749883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."accounts_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL, "client_id" uuid NOT NULL, "account_number" character varying(30) NOT NULL, "alias" character varying(80) NOT NULL, "currency" "public"."accounts_currency_enum" NOT NULL, "balance" numeric(14,2) NOT NULL DEFAULT '0', "status" "public"."accounts_status_enum" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ffd1ae96513bfb2c6eada0f7d31" UNIQUE ("account_number"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TYPE "public"."client_status_enum" RENAME TO "client_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."clients_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "status" TYPE "public"."clients_status_enum" USING "status"::"text"::"public"."clients_status_enum"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."client_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE TYPE "public"."client_status_enum_old" AS ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "status" TYPE "public"."client_status_enum_old" USING "status"::"text"::"public"."client_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`);
        await queryRunner.query(`DROP TYPE "public"."clients_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."client_status_enum_old" RENAME TO "client_status_enum"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_currency_enum"`);
    }

}
