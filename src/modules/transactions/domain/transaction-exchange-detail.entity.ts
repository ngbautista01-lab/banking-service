import { Field, Float, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Currency } from '../../../common/domain/currency.enum';
import { decimalTransformer } from '../../../common/domain/decimal.transformer';
import { TransactionEntity } from './transaction.entity';

@ObjectType('TransactionExchangeDetail')
@Entity({ name: 'transaction_exchange_details' })
export class TransactionExchangeDetailEntity {
  @Field()
  @PrimaryColumn('uuid', { name: 'transaction_id' })
  transactionId!: string;

  @Field(() => Currency)
  @Column({ name: 'base_currency', type: 'enum', enum: Currency })
  baseCurrency!: Currency;

  @Field(() => Currency)
  @Column({ name: 'quote_currency', type: 'enum', enum: Currency })
  quoteCurrency!: Currency;

  @Field(() => Float)
  @Column({
    name: 'source_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  sourceAmount!: number;

  @Field(() => Float)
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 6,
    transformer: decimalTransformer,
  })
  rate!: number;

  @Field(() => Float)
  @Column({
    name: 'converted_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  convertedAmount!: number;

  @Field()
  @Column({ name: 'effective_at', type: 'timestamp' })
  effectiveAt!: Date;

  @OneToOne(() => TransactionEntity, (transaction) => transaction.exchangeDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id', referencedColumnName: 'id' })
  transaction!: TransactionEntity;
}
