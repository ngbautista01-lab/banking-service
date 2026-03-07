import { registerEnumType } from '@nestjs/graphql';

export enum Currency {
  DOP = 'DOP',
  USD = 'USD',
  EUR = 'EUR',
}

registerEnumType(Currency, {
  name: 'Currency',
});
