import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsEnum, IsNotEmpty, Length } from 'class-validator';
import { ClientStatus } from '../domain/client.types';

@InputType()
export class CreateClientInput {
  @Field()
  @IsNotEmpty()
  @Length(2, 80)
  firstName!: string;

  @Field()
  @IsNotEmpty()
  @Length(2, 80)
  lastName!: string;

  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsNotEmpty()
  @Length(9, 15)
  documentNumber!: string;

  @Field()
  @IsNotEmpty()
  @Length(7, 20)
  phone!: string;

  @Field(() => ClientStatus, { defaultValue: ClientStatus.ACTIVE })
  @IsEnum(ClientStatus)
  status: ClientStatus = ClientStatus.ACTIVE;
}

@InputType()
export class SearchClientsInput {
  @Field()
  @IsNotEmpty()
  @Length(2, 80)
  term!: string;
}
