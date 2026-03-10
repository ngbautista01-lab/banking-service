import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExchangeRates1773190000000
  implements MigrationInterface
{
  name = 'CreateExchangeRates1773190000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "exchange_rates" (
        "id" uuid NOT NULL,
        "base_currency" "public"."transactions_currency_enum" NOT NULL,
        "quote_currency" "public"."transactions_currency_enum" NOT NULL,
        "rate" numeric(14,6) NOT NULL,
        "effective_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exchange_rates_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_exchange_rates_pair_effective_at"
      ON "exchange_rates" ("base_currency", "quote_currency", "effective_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_exchange_rates_pair_effective_at"`,
    );
    await queryRunner.query(`DROP TABLE "exchange_rates"`);
  }
}
