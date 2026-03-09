export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export interface AccountUniquenessCheck {
  accountNumber?: string;
}

export interface AccountProfile {
  id: string;
  clientId: string;
  accountNumber: string;
  alias: string;
  currency: string;
  balance: number;
  status: AccountStatus;
}
