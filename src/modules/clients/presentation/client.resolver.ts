import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ClientService } from '../application/client.service';
import { CreateClientInput, SearchClientsInput } from '../application/client.dto';
import { ClientEntity } from '../domain/client.entity';

@Resolver(() => ClientEntity)
export class ClientResolver {
  constructor(private readonly clientService: ClientService) {}

  @Query(() => [ClientEntity], { name: 'clients' })
  async findAll() {
    return this.clientService.findAll();
  }

  @Query(() => ClientEntity, { name: 'client' })
  async findById(@Args('id', { type: () => String }) id: string) {
    return this.clientService.findById(id);
  }

  @Query(() => [ClientEntity], { name: 'searchClients' })
  async search(@Args('input') input: SearchClientsInput) {
    return this.clientService.search(input);
  }
u
  @Mutation(() => ClientEntity)
  async createClient(@Args('input') input: CreateClientInput) {
    return this.clientService.create(input);
  }
}
