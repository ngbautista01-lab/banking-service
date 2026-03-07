export interface ClientUniquenessCheck {
  email?: string;
  documentNumber?: string;
}

export enum CustomerType {
  NATURAL_PERSON = "natural_person",
  LEGAL_ENTITY = "legal_entity",
}

export interface ClientProfile {
  id:string;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  phone: string;
  status: string;
  type: CustomerType
}
