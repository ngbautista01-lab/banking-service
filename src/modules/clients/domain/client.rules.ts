import { AppException } from '../../../common/errors/app.exception';
import { ClientEntity } from './client.entity';

export class ClientRules {
  static ensureIsUnique(existingClient: ClientEntity | null): void {
    if (existingClient) {
      throw new AppException('CLIENT_ALREADY_EXISTS');
    }
  }

  static normalizePhone(phone: string): string {
    const normalizedPhone = phone.trim();

    if (!/^[0-9+\-\s()]+$/.test(normalizedPhone)) {
      throw new AppException('INVALID_CLIENT_PHONE');
    }

    return normalizedPhone;
  }

  static validateNaturalPersonId(nationalId: string): boolean {
    const cleaned = this.normalizeDocumentNumber(nationalId);

    if (cleaned.length !== 11) return false;

    return /^\d+$/.test(cleaned);
  }

  static validateLegalEntityId(rnc: string): boolean {
    const cleaned = this.normalizeDocumentNumber(rnc);
    if (cleaned.length !== 9) return false;
    return /^\d+$/.test(cleaned);
  }

  static validateDocumentNumber(documentNumber: string): void {
    const normalized = this.normalizeDocumentNumber(documentNumber);

    if (
      !this.validateNaturalPersonId(normalized) &&
      !this.validateLegalEntityId(normalized)
    ) {
      throw new AppException('INVALID_CLIENT_DOCUMENT');
    }
  }

  static normalizeDocumentNumber(documentNumber: string): string {
    return documentNumber.trim().replace(/[\s-]+/g, '');
  }

}
