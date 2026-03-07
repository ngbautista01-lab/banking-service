# Clients Service

Microservicio backend en NestJS enfocado unicamente en el modulo de clientes para implementar la prueba tecnica paso a paso, con cache y busqueda integradas en este mismo modulo.

## Stack

- Node.js + NestJS + TypeScript
- GraphQL code-first
- PostgreSQL + TypeORM + migraciones
- Redis para cache de clientes
- ElasticSearch para busqueda de clientes
- Jest para pruebas unitarias

## Arquitectura

El proyecto sigue una estructura por capas dentro de un modular monolith:

- `presentation`: resolvers GraphQL
- `application`: casos de uso, DTOs y reglas de orquestacion
- `domain`: entidades, enums y tipos del dominio
- `infrastructure`: TypeORM, cache y busqueda

Modulo activo:

- `clients`: alta y consulta de clientes

## Reglas de negocio incluidas

- Un cliente no puede repetirse por email o documento
- El cliente tiene estado y telefono como parte del dominio
- Consulta individual y listado usan cache
- Busqueda por termino usa ElasticSearch y, si falla, hace fallback a PostgreSQL

## Variables de entorno

Copiar `.env.example` y ajustar segun sea necesario.

## Ejecucion local

1. Levantar todo con Docker:

```bash
docker compose up --build
```

Esto deja disponible:

- `http://localhost:3000/`
- `http://localhost:3000/graphql`

2. Alternativa local sin Docker para la app:

```bash
docker compose up -d postgres redis elasticsearch
```

3. Instalar dependencias:

```bash
npm install
```

4. Ejecutar migraciones:

```bash
npm run migration:run
```

5. Iniciar servicio:

```bash
npm run start:dev
```

GraphQL Playground queda disponible en `http://localhost:3000/graphql`.

## Docker Compose

El `docker-compose.yml` incluye:

- `postgres`
- `redis`
- `elasticsearch`

## Scripts utiles

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npm run test:cov
npm run migration:run
npm run migration:revert
```

## Ejemplos GraphQL

Crear cliente:

```graphql
mutation {
  createClient(
    input: {
      firstName: "Ana"
      lastName: "Perez"
      email: "ana@example.com"
      documentNumber: "001-0000001-1"
      phone: "8095550101"
      status: ACTIVE
    }
  ) {
    id
    email
    phone
    status
  }
}
```

Consultar clientes:

```graphql
query {
  clients {
    id
    firstName
    lastName
    email
    phone
    status
  }
}
```

Buscar clientes:

```graphql
query {
  searchClients(input: { term: "ana" }) {
    id
    firstName
    lastName
    email
    phone
    status
  }
}
```

## Pruebas

Cobertura incluida:

- Unitaria para reglas del dominio de clientes

## Consideraciones

- El proyecto usa migraciones versionadas, no `synchronize`.
- La idea es implementar el resto de modulos de forma incremental una vez quede claro el modulo de clientes.
