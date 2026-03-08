import { AppDataSource } from '../infrastructure/database/typeorm.config';
import { ClientEntity } from '../modules/clients/domain/client.entity';
import { ClientRules } from '../modules/clients/domain/client.rules';
import { ClientStatus } from '../modules/clients/domain/client.types';

const seedClients = [
  {
    firstName: 'Ana',
    lastName: 'Perez',
    documentNumber: '00112345678',
    email: 'ana.perez@example.com',
    phone: '8095550101',
    status: ClientStatus.ACTIVE,
  },
  {
    firstName: 'Luis',
    lastName: 'Garcia',
    documentNumber: '101234567',
    email: 'luis.garcia@example.com',
    phone: '8095550102',
    status: ClientStatus.ACTIVE,
  },
  {
    firstName: 'Maria',
    lastName: 'Lopez',
    documentNumber: '40212345678',
    email: 'maria.lopez@example.com',
    phone: '8095550103',
    status: ClientStatus.INACTIVE,
  },
] as const;

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const clientRepository = AppDataSource.getRepository(ClientEntity);

    for (const seedClient of seedClients) {
      const documentNumber = ClientRules.normalizeDocumentNumber(
        seedClient.documentNumber,
      );
      ClientRules.validateDocumentNumber(documentNumber);

      const existingClient = await clientRepository.findOne({
        where: [{ email: seedClient.email }, { documentNumber }],
      });

      if (existingClient) {
        continue;
      }

      const client = clientRepository.create({
        ...seedClient,
        documentNumber,
        phone: ClientRules.normalizePhone(seedClient.phone),
      });

      await clientRepository.save(client);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

void seed();
