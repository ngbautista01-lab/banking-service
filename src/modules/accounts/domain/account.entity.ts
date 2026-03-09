import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Currency } from '../../../common/domain/currency.enum';
import { decimalTransformer } from '../../../common/domain/decimal.transformer';
import { AccountStatus } from './account.types';

registerEnumType(AccountStatus, {
  name: 'AccountStatus',
});

@ObjectType('Account')
@Entity({ name: 'accounts' })
export class AccountEntity {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  id!: string;

  @Field()
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Field()
  @Column({ name: 'account_number', unique: true, length: 30 })
  accountNumber!: string;

  @Field()
  @Column({ length: 80 })
  alias!: string;

  @Field(() => Currency)
  @Column({ type: 'enum', enum: Currency })
  currency!: Currency;

  @Field()
  @Column({
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  balance!: number;

  @Field(() => AccountStatus)
  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status!: AccountStatus;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
