import { AppException } from '../../../common/errors/app.exception';
import { ClientRules } from './client.rules';

describe('ClientRules', () => {
  it('rejects duplicated clients', () => {
    expect(() =>
      ClientRules.ensureIsUnique({
        id: '1',
      }),
    ).toThrow(AppException);
  });

  it('normalizes phone values', () => {
    expect(ClientRules.normalizePhone(' 8095550101 ')).toBe('8095550101');
  });

  it('accepts valid natural person ids and legal entity ids', () => {
    expect(ClientRules.validateNaturalPersonId('00112345678')).toBe(true);
    expect(ClientRules.validateLegalEntityId('101234567')).toBe(true);
  });

  it('rejects invalid document numbers', () => {
    expect(() => ClientRules.validateDocumentNumber('ABC123')).toThrow(AppException);
  });

  it('normalizes document number before validation and persistence', () => {
    expect(ClientRules.normalizeDocumentNumber(' 001-1234567-8 ')).toBe('00112345678');
  });
});
