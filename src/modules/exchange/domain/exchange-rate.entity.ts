import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../../../common/domain/currency.enum';
import { decimalTransformer } from '../../../common/domain/decimal.transformer';

@ObjectType('ExchangeRate')
@Entity({ name: 'exchange_rates' })
export class ExchangeRateEntity {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  id!: string;

  @Field(() => Currency)
  @Column({ name: 'base_currency', type: 'enum', enum: Currency })
  baseCurrency!: Currency;

  @Field(() => Currency)
  @Column({ name: 'quote_currency', type: 'enum', enum: Currency })
  quoteCurrency!: Currency;

  @Field(() => Float)
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 6,
    transformer: decimalTransformer,
  })
  rate!: number;

  @Field()
  @Column({ name: 'effective_at', type: 'timestamp' })
  effectiveAt!: Date;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
