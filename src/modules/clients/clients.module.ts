import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientService } from './application/client.service';
import { CLIENT_REPOSITORY } from './application/ports/client.repository';
import { ClientEntity } from './domain/client.entity';
import { TypeOrmClientRepository } from './infrastructure/typeorm-client.repository';
import { ClientResolver } from './presentation/client.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity])],
  providers: [
    ClientService,
    ClientResolver,
    TypeOrmClientRepository,
    {
      provide: CLIENT_REPOSITORY,
      useExisting: TypeOrmClientRepository,
    },
  ],
  exports: [ClientService, TypeOrmModule],
})
export class ClientsModule {}
