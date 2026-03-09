import { Field, Float, InputType, PartialType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsNumber, IsUUID, Length, Min } from 'class-validator';
import { Currency } from '../../../common/domain/currency.enum';
import { AccountStatus } from '../domain/account.types';

@InputType()
export class CreateAccountInput {
  @Field()
  @IsUUID()
  clientId!: string;

  @Field()
  @IsNotEmpty()
  @Length(8, 30)
  accountNumber!: string;

  @Field()
  @IsNotEmpty()
  @Length(2, 80)
  alias!: string;

  @Field(() => Currency)
  @IsEnum(Currency)
  currency!: Currency;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  balance = 0;

  @Field(() => AccountStatus, { defaultValue: AccountStatus.ACTIVE })
  @IsEnum(AccountStatus)
  status: AccountStatus = AccountStatus.ACTIVE;
}

@InputType()
export class SearchAccountsInput {
  @Field()
  @IsNotEmpty()
  @Length(2, 80)
  term!: string;
}

@InputType()
export class UpdateAccountInput extends PartialType(CreateAccountInput) {
  @Field()
  @IsNotEmpty()
  id!: string;
}
