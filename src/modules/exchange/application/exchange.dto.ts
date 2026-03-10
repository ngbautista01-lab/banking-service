import { Field, Float, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Currency } from '../../../common/domain/currency.enum';

@InputType()
export class CreateExchangeRateInput {
  @Field(() => Currency)
  @IsEnum(Currency)
  baseCurrency!: Currency;

  @Field(() => Currency)
  @IsEnum(Currency)
  quoteCurrency!: Currency;

  @Field(() => Float)
  @IsNumber()
  @Min(0.000001)
  rate!: number;

  @Field()
  @Type(() => Date)
  @IsDate()
  effectiveAt!: Date;
}

@InputType()
export class UpdateExchangeRateInput extends PartialType(CreateExchangeRateInput) {
  @Field()
  @IsUUID()
  id!: string;
}

@InputType()
export class ConvertCurrencyInput {
  @Field(() => Currency)
  @IsEnum(Currency)
  baseCurrency!: Currency;

  @Field(() => Currency)
  @IsEnum(Currency)
  quoteCurrency!: Currency;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveAt?: Date;
}

@ObjectType('CurrencyConversion')
export class CurrencyConversionOutput {
  @Field(() => Currency)
  baseCurrency!: Currency;

  @Field(() => Currency)
  quoteCurrency!: Currency;

  @Field(() => Float)
  amount!: number;

  @Field(() => Float)
  rate!: number;

  @Field(() => Float)
  convertedAmount!: number;

  @Field()
  effectiveAt!: Date;
}
