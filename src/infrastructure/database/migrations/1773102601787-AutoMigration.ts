import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1773102601787 implements MigrationInterface {
    name = 'AutoMigration1773102601787'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('deposit', 'withdrawal', 'transfer')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_channel_enum" AS ENUM('atm', 'mobile', 'web', 'branch', 'api')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_currency_enum" AS ENUM('DOP', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL, "source_account_id" uuid NOT NULL, "destination_account_id" uuid, "type" "public"."transactions_type_enum" NOT NULL, "channel" "public"."transactions_channel_enum" NOT NULL, "currency" "public"."transactions_currency_enum" NOT NULL, "amount" numeric(14,2) NOT NULL, "reference" character varying(60) NOT NULL, "description" character varying(160), "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'PENDING', "source_previous_balance" numeric(14,2) NOT NULL DEFAULT '0', "source_current_balance" numeric(14,2) NOT NULL DEFAULT '0', "destination_previous_balance" numeric(14,2), "destination_current_balance" numeric(14,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dd85cc865e0c3d5d4be095d3f3f" UNIQUE ("reference"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    }

}
