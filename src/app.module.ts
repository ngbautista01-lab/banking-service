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
            ? (error as { originalError?: unknown })
            : undefined;
        const originalError =
          typeof graphQLError?.originalError === 'object' &&
          graphQLError.originalError !== null
            ? (graphQLError.originalError as {
                response?: { code?: string };
                status?: number;
              })
            : undefined;

        const code =
          originalError?.response?.code ??
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
    ClientsModule,
  ],
})
export class AppModule {}
