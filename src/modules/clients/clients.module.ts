import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientService } from './application/client.service';
import { ClientEntity } from './domain/client.entity';
import { ClientResolver } from './presentation/client.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity])],
  providers: [ClientService, ClientResolver],
  exports: [ClientService, TypeOrmModule],
})
export class ClientsModule {}
