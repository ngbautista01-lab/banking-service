import { join } from 'path';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLFormattedError } from 'graphql';
import { CacheModule } from './infrastructure/cache/cache.module';
import { ErrorCatalog } from './common/errors/error-catalog';
import { DatabaseModule } from './infrastructure/database/database.module';
import { SearchModule } from './infrastructure/search/search.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AppController } from './app.controller';
import { AccountsModule } from './modules/accounts/accounts.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { HealthModule } from './modules/health/health.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  controllers: [AppController],
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: false,
      sortSchema: true,
      formatError: (_formattedError, error): GraphQLFormattedError => {
        const graphQLError =
          typeof error === 'object' && error !== null
            ? (error as {
                originalError?: unknown;
                extensions?: { originalError?: unknown; code?: string };
              })
            : undefined;
        const originalErrorCandidate =
          graphQLError?.originalError ?? graphQLError?.extensions?.originalError;
        const originalError =
          typeof originalErrorCandidate === 'object' &&
          originalErrorCandidate !== null
            ? (originalErrorCandidate as {
                response?: { code?: string };
                status?: number;
                code?: string;
                message?: string;
              })
            : undefined;

        const code =
          originalError?.response?.code ??
          originalError?.code ??
          graphQLError?.extensions?.code ??
          ErrorCatalog.INTERNAL_ERROR.code;
        const statusCode =
          originalError?.status ?? ErrorCatalog.INTERNAL_ERROR.httpStatus;

        return {
          message: code,
          extensions: {
            code,
            statusCode,
          },
        };
      },
    }),
    CacheModule,
    DatabaseModule,
    SearchModule,
    HealthModule,
    ClientsModule,
    AccountsModule,
    ExchangeModule,
    TransactionsModule,
  ],
})
export class AppModule {}
