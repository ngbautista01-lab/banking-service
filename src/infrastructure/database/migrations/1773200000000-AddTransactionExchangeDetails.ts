import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionExchangeDetails1773200000000
  implements MigrationInterface
{
  name = 'AddTransactionExchangeDetails1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "transaction_exchange_details" (
        "transaction_id" uuid NOT NULL,
        "base_currency" "public"."transactions_currency_enum" NOT NULL,
        "quote_currency" "public"."transactions_currency_enum" NOT NULL,
        "source_amount" numeric(14,2) NOT NULL,
        "rate" numeric(14,6) NOT NULL,
        "converted_amount" numeric(14,2) NOT NULL,
        "effective_at" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_transaction_exchange_details_transaction_id" PRIMARY KEY ("transaction_id"),
        CONSTRAINT "FK_transaction_exchange_details_transaction_id" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transaction_exchange_details"`);
  }
}
