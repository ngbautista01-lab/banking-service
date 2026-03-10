import { Field, Float, InputType, PartialType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { Currency } from '../../../common/domain/currency.enum';
import {
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../domain/transaction.types';

function normalizeTransactionType(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toUpperCase();
  return TransactionType[normalized as keyof typeof TransactionType] ?? value;
}

function normalizeTransactionChannel(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toUpperCase();
  return TransactionChannel[normalized as keyof typeof TransactionChannel] ?? value;
}

function normalizeUppercaseValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toUpperCase();
}

@InputType()
export class CreateTransactionInput {
  @Field()
  @IsUUID()
  sourceAccountId!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @Field(() => String)
  @Transform(({ value }) => normalizeTransactionType(value))
  @IsEnum(TransactionType)
  type!: TransactionType;

  @Field(() => String)
  @Transform(({ value }) => normalizeTransactionChannel(value))
  @IsEnum(TransactionChannel)
  channel!: TransactionChannel;

  @Field(() => String)
  @Transform(({ value }) => normalizeUppercaseValue(value))
  @IsEnum(Currency)
  currency!: Currency;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @Field()
  @IsNotEmpty()
  @IsString()
  @Length(4, 60)
  reference!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  description?: string;

  @Field(() => String, {
    defaultValue: TransactionStatus.PENDING,
  })
  @Transform(({ value }) => normalizeUppercaseValue(value))
  @IsEnum(TransactionStatus)
  status: TransactionStatus = TransactionStatus.PENDING;
}

@InputType()
export class SearchTransactionsInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  @Length(2, 80)
  term!: string;
}

@InputType()
export class UpdateTransactionInput extends PartialType(CreateTransactionInput) {
  @Field()
  @IsUUID()
  id!: string;
}
