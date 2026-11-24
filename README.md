# Twitter Clone

A modular full-stack social platform built with **TypeScript**, **NestJS**, **Next.js (Pages Router)**, **PostgreSQL** (Drizzle ORM + pgvector), **Redis**, **RabbitMQ**, **MongoDB**, and **GraphQL**. Local infrastructure is orchestrated with Docker Compose, Terraform, and Kubernetes (Kind).

## Architecture Overview

The repository combines a modular NestJS backend (`src/`) with Next.js pages and API routes (`pages/`), shared domain models and schemas (`models/`), and infrastructure and migration tooling (`infra/`).

### NestJS Modular Monolith (`src/`)

- **Modules (`src/modules/`):** `users`, `posts`, `migrations`, `status`, and `graphql`.
- **Common Layer (`src/common/`):** `@RequireFeatures` decorator, `SessionAuthGuard`, `FeaturesGuard`, `DomainExceptionFilter`, and `ZodValidationPipe`.
- **Infrastructure Services (`src/infra/`):**
  - `DatabaseService` for database access.
  - `MailService` with activation and welcome email templates.
  - `RabbitMQService` for asynchronous background events, such as `post.created`.
  - `MongoDBService` for flexible, high-write data such as activity logs.
  - `AiService` for embeddings and Retrieval-Augmented Generation (RAG).

### Next.js & Shared Models (`pages/`, `models/`, `infra/`)

- Next.js Pages Router frontend (`pages/index.js`, `pages/status/index.js`) and REST API routes (`pages/api/v1/...`).
- PostgreSQL migrations managed with `node-pg-migrate` (`infra/migrations/`), including `pgvector` support.
- Drizzle ORM schema (`models/schema.ts`, `infra/drizzle.ts`).
- Session management (`models/session.js`) using `argon2` password verification and `HttpOnly` session cookies.
- Structured logging with Pino (`infra/logger.ts`) and rate limiting (`infra/rate-limiter.ts`).

### Local Infrastructure & Infrastructure as Code (`infra/`)

- **Docker Compose (`infra/compose.yaml`):** PostgreSQL (`pgvector/pgvector:pg16`), Redis (`redis:7-alpine`), Mailpit (`axllent/mailpit:v1.21`), RabbitMQ (`rabbitmq:3.13-management-alpine`), and MongoDB (`mongo:7`).
- **Terraform (`infra/terraform/`):** Declarative Docker provider configuration (`main.tf`, `variables.tf`) for local containers and networking.
- **Kubernetes (`infra/k8s/`):** Manifests for local clusters such as Kind, including `namespace.yaml`, `config-secret.yaml`, `postgres.yaml`, `redis.yaml`, `mongodb.yaml`, `rabbitmq.yaml`, and `mailpit.yaml`.

## Tech Stack

| Category                     | Technologies                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Runtime & Language**       | Node.js, TypeScript, JavaScript                                                                                         |
| **Backend & Web**            | NestJS, Next.js (Pages Router), React, SWR, GraphQL, Zod                                                                |
| **Databases & Messaging**    | PostgreSQL, `pg`, `node-pg-migrate`, Drizzle ORM, `pgvector`, Redis, `ioredis`, MongoDB, `mongodb`, RabbitMQ, `amqplib` |
| **Security & Observability** | `argon2`, Pino, rate limiting                                                                                           |
| **Testing & Tooling**        | Jest, Supertest, integration test helpers, Playwright, ESLint, Prettier, Husky, Commitlint, Commitizen                  |

## Project Structure

```text
├── .github/workflows/    # CI workflows for linting, unit/integration tests, and E2E tests
├── .husky/               # Git hooks (e.g., commitlint on commit-msg)
├── infra/
│   ├── k8s/              # Kubernetes manifests (Namespace, ConfigMap/Secret, Deployments, Services)
│   ├── migrations/       # Database migrations (users, activation, sessions/RBAC, posts, pgvector)
│   ├── scripts/          # Development environment and database readiness helpers
│   └── terraform/        # Terraform configuration using the Docker provider
├── models/               # Shared models, schemas, migrator, session, and user logic
├── pages/                # Next.js pages and /api/v1 REST endpoints
├── src/
│   ├── common/           # Guards, decorators, exception filters, and Zod validation pipes
│   ├── infra/            # NestJS infrastructure modules (AI, database, mail, messaging, MongoDB)
│   └── modules/          # Feature modules (graphql, migrations, posts, status, users)
├── styles/               # Global styles
└── tests/
    ├── e2e/              # Playwright end-to-end tests
    ├── integration/      # Jest integration tests (API routes and models)
    └── unit/             # Jest unit tests (infra, models, and NestJS src)
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Services & Run Migrations

The `npm run dev` command automatically:

1. Generates `.env.development` if it does not exist, using `ensure-env-dev.js`.
2. Starts Docker containers through `infra/compose.yaml`.
3. Waits for PostgreSQL to become available.
4. Runs pending database migrations.
5. Starts the NestJS and Next.js development servers concurrently.

```bash
npm run dev
```

You can also manage services and migrations individually:

```bash
npm run services:up
npm run services:wait:database
npm run migrations:up
npm run services:stop
npm run services:down
```

## Testing, Type-Checking & Linting

**Unit and integration tests, including TypeScript type-checking:**

```bash
npm test
```

**Playwright end-to-end tests:**

```bash
npm run e2e
```

Interactive mode:

```bash
npm run e2e:ui
```

**Full test suite (Jest, type-checking, and Playwright):**

```bash
npm run test:all
```

**Watch mode and type-checking:**

```bash
npm run test:watch
npm run type-check
```

**Linting and formatting:**

```bash
npm run lint:all
npm run lint:eslint:check
npm run lint:prettier:check
npm run lint:prettier:fix
```

## Local Infrastructure (Terraform & Kubernetes)

### Terraform (Docker Provider)

```bash
cd infra/terraform
terraform init
terraform validate
terraform plan
```

### Kubernetes (Kind)

```bash
kind create cluster --name twitter-clone
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/
kubectl get all -n twitter-clone
```

## License

MIT
