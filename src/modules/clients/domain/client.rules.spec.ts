import { AppException } from '../../../common/errors/app.exception';
import { ClientRules } from './client.rules';

describe('ClientRules', () => {
  describe('normalizeDocumentNumber', () => {
    it('removes spaces and hyphens', () => {
      expect(ClientRules.normalizeDocumentNumber('001-1234567-8')).toBe(
        '00112345678',
      );
    });
  });

  describe('normalizePhone', () => {
    it('returns a trimmed phone when format is valid', () => {
      expect(ClientRules.normalizePhone(' 8095550101 ')).toBe('8095550101');
    });

    it('throws when phone contains invalid characters', () => {
      expect(() => ClientRules.normalizePhone('809-ABC-0101')).toThrow(
        AppException,
      );
    });
  });

  describe('validateDocumentNumber', () => {
    it('accepts a valid natural person id', () => {
      expect(() =>
        ClientRules.validateDocumentNumber('00112345678'),
      ).not.toThrow();
    });

    it('accepts a valid legal entity id', () => {
      expect(() =>
        ClientRules.validateDocumentNumber('101234567'),
      ).not.toThrow();
    });

    it('rejects an invalid document number', () => {
      expect(() => ClientRules.validateDocumentNumber('ABC123')).toThrow(
        AppException,
      );
    });
  });

  describe('ensureIsUnique', () => {
    it('throws when the client already exists', () => {
      expect(() => ClientRules.ensureIsUnique({ id: 'client-id' })).toThrow(
        AppException,
      );
    });

    it('does not throw when the client is unique', () => {
      expect(() => ClientRules.ensureIsUnique(null)).not.toThrow();
    });
  });
});
