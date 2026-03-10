import { Field, Float, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../../../common/domain/currency.enum';
import { decimalTransformer } from '../../../common/domain/decimal.transformer';
import { TransactionStatus, TransactionType, TransactionChannel } from './transaction.types';
import { TransactionExchangeDetailEntity } from './transaction-exchange-detail.entity';

registerEnumType(TransactionType, {
  name: 'TransactionType',
});

registerEnumType(TransactionChannel, {
  name: 'TransactionChannel',
});

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
});


@ObjectType('Transaction')
@Entity({ name: 'transactions' })
export class TransactionEntity {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  id!: string;

  @Field()
  @Column({ name: 'source_account_id', type: 'uuid' })
  sourceAccountId!: string;

  @Field(() => String, { nullable: true })
  @Column({ name: 'destination_account_id', type: 'uuid', nullable: true })
  destinationAccountId!: string | null;

  @Field(() => TransactionType)
  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Field(() => TransactionChannel)
  @Column({ type: 'enum', enum: TransactionChannel })
  channel!: TransactionChannel;

  @Field(() => Currency)
  @Column({ type: 'enum', enum: Currency })
  currency!: Currency;

  @Field(() => Float)
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Field()
  @Column({ unique: true, length: 60 })
  reference!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 160, nullable: true })
  description!: string | null;

  @Field(() => TransactionStatus)
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Field(() => TransactionExchangeDetailEntity, { nullable: true })
  @OneToOne(
    () => TransactionExchangeDetailEntity,
    (exchangeDetails) => exchangeDetails.transaction,
    { nullable: true, eager: true },
  )
  exchangeDetails!: TransactionExchangeDetailEntity | null;

  @Field(() => Float)
  @Column({
    name: 'source_previous_balance',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  sourcePreviousBalance!: number;

  @Field(() => Float)
  @Column({
    name: 'source_current_balance',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  sourceCurrentBalance!: number;

  @Field(() => Float, { nullable: true })
  @Column({
    name: 'destination_previous_balance',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
    nullable: true,
  })
  destinationPreviousBalance!: number | null;

  @Field(() => Float, { nullable: true })
  @Column({
    name: 'destination_current_balance',
    type: 'numeric',
    precision: 14,
    scale: 2,
    transformer: decimalTransformer,
    nullable: true,
  })
  destinationCurrentBalance!: number | null;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
