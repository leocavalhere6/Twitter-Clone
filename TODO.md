# todo.md — Twitter Clone (Roadmap de Engenharia)

## Ações Imediatas (Pré-Pivô / Estabilização) — Concluído

- **Fix #1: Estabilizar Teste de Integração (`status/get.test.js`) (Concluído)**
- **Fix #2: Refinar Cobertura de Testes & Escopo (`jest.config.js`) (Concluído)**
- **Fix #3: Regra Arquitetural para o Pivô (Concluído)**

---

## Fase 1: Fundação de Engenharia, Qualidade e Interface Inicial — Concluído

- **PR #1: Higiene do Repositório (.gitignore & Clean Build) (Concluído)**
- **PR #2: Tipagem Estática (TypeScript Setup) (Concluído)**
- **PR #3: Validação Declarativa de Schemas (Zod) (Concluído)**
- **PR #4: Observabilidade e Logs Estruturados (Pino) (Concluído)**
- **PR #5: Middleware de Rate Limiting (Concluído)**
- **PR #6: Interface Mínima de Front-end (Concluído)**
- **PR #7: Testes End-to-End e de API (Playwright) (Concluído)**
- **PR #8: Abstração de Banco de Dados (Drizzle ORM) (Concluído)**

---

## Fase 2: O Pivô Arquitetural (Backend em NestJS) — Concluído

- **PR #9: Migração para o NestJS (Fundação de Domínios) (Concluído)**
  - **Escopo entregue:** Estruturação da pasta `src/` em TypeScript estrito, `DatabaseService`, `MailService`, filtros de exceção, pipes com Zod e módulos `Status`, `Migrations` e `Users` (`src/modules/`), mantendo coexistência com as rotas HTTP em `pages/api/v1/` e modelos compartilhados em `models/`.

---

## Fase 3: Identidade, Segurança e Comunicação — Concluído

- **PR #10: Serviço de E-mails Transacionais (Concluído)**
  - **Escopo entregue:** Mailpit no Docker, templates de e-mail (`activation` e `welcome`) e `MailService` testado.
- **PR #11: Perfil de Usuário & Engenharia de Senhas (Concluído)**
  - **Escopo entregue:** Geração automática de `.env.development` (`ensure-env-dev.js`), hash de senhas com `argon2id`, campos `active` e `activation_token` no schema/migration, e fluxo de ativação de conta.
- **PR #12 & PR #13 (Consolidados): Autenticação & Autorização (RBAC) (Concluído)**
  - **Escopo entregue:**
    - Tabela `sessions` e colunas `role` (`default: 'user'`) e `features` (`default: ['create:session', 'read:session']`) em `users`.
    - `models/session.js` com `argon2.verify`, bloqueio de conta inativa (`active: false`), criação/expiração de sessão e cookies `session_id` (`HttpOnly`, `SameSite=Lax`, `Path=/`, e `Secure` em produção).
    - Endpoints `POST` e `DELETE /api/v1/sessions` (login e logout).
    - Decorator `@RequireFeatures(...)`, `SessionAuthGuard` e `FeaturesGuard` no NestJS para autenticação por cookie e validação de escopos/papel (`401`/`403`).

---

## Fase 4: Escalabilidade, Dados, IA e Arquitetura Avançada (Monolito Modular) — Concluído

- **PR #14: Módulo de Posts & Mensageria Assíncrona (RabbitMQ) (Concluído)**
  - **Escopo:** Manter o monolito modular em NestJS (evitando o overhead operacional de múltiplos microsserviços separados), adicionando o módulo `Posts` (`src/modules/posts/`) e infraestrutura RabbitMQ (`src/infra/messaging/`) para publicar eventos como `post.created` e consumir tarefas em background de forma assíncrona (geração de embeddings, auditoria/logs e notificações).
- **PR #15: Camada de Dados Não Relacionais (MongoDB) (Concluído)**
  - **Escopo:** Manter o PostgreSQL + Drizzle ORM como banco principal transacional e integrar MongoDB (`src/infra/mongodb/`) de forma complementar e não bloqueante para dados de alta escrita ou schema flexível (ex.: `activity_logs` de eventos/auditoria e `notifications`).
- **PR #16: Busca Vetorial e RAG Simples (`pgvector` + IA Gratuita) (Concluído)**
  - **Escopo:** Habilitar `pgvector` no PostgreSQL existente via migration, armazenar embeddings dos posts (gerados no fluxo assíncrono do PR #14 usando camada de serviço desacoplada sobre API gratuita de LLM, como Gemini free tier) e expor busca por similaridade vetorial (`<=>`) / RAG simples em cima dos conteúdos.
- **PR #17: Camada de Consulta Flexível (GraphQL) (Concluído)**
  - **Escopo:** Expor endpoint `/graphql` no NestJS paralelo ao REST, com queries e mutations reutilizando os mesmos services dos módulos (feed, perfil, posts, busca semântica e dados aninhados) sem duplicar regras de negócio.

---

## Fase 5: Experiência Completa do Usuário (Front-end Definitivo) — Concluído

- **PR #18: Desenvolvimento Completo do Front-End (Next.js) (Concluído)**
  - **Escopo:** Construir as páginas completas da aplicação no Next.js (perfil, timeline em tempo real, interações, busca semântica/RAG e notificações) integradas aos serviços do NestJS.

---

## Fase 6: Infraestrutura Local e IaC — Em Andamento

- **PR #19 & PR #20 (Consolidados): Orquestração Local com Kubernetes (Kind / Minikube) e IaC (Terraform)**
  - **Escopo:**
    - Criar manifests Kubernetes básicos (`Deployment`, `Service`, `ConfigMap`/`Secret` conforme necessário) e validar a subida/comunicação da stack em cluster local (Kind ou Minikube).
    - Provisionar e gerenciar ambiente declarativamente via Terraform (provider Docker local) alinhado aos serviços da aplicação.

---

## Fase 7: Refinamento de Qualidade, Cobertura e Consolidação Arquitetural — Próximos PRs

- **PR #21: Cobertura de Testes nos Módulos NestJS (`Posts` e `GraphQL`)**

  - **Escopo:** Cobrir `src/modules/posts/` (`posts.controller.ts`, `posts.service.ts`, `posts.repository.ts`, `create-post.dto.ts`) e `src/modules/graphql/` (`graphql.controller.ts`, `graphql.service.ts`) com testes unitários e de integração direcionados às implementações da camada `src/`.

- **PR #22: Cobertura de Testes em Sessão e Infraestrutura (`Session`, `RabbitMQ`, `MongoDB`)**

  - **Escopo:** Elevar a cobertura de `models/session.js`, `src/infra/messaging/rabbitmq.service.ts`, `src/infra/mongodb/mongodb.service.ts` e `src/infra/database/database.service.ts` (incluindo cenários de erro, reconexão/falha e fluxos de sessão).

- **PR #23: Definição da Fonte de Verdade Arquitetural (`pages/api/` + `models/` vs. `src/` NestJS)**

  - **Escopo:** Padronizar e documentar qual camada é a fonte de verdade para cada domínio (ex.: auth/sessão, usuários, posts, status e migrations), eliminando duplicações de regra de negócio entre rotas Next.js (`pages/api/v1/`), `models/` e módulos NestJS (`src/modules/`).

- **PR #24: Higiene de Artefatos, Metadados do Repositório e Scripts de Teste**

  - **Escopo:**
    - Garantir que diretórios gerados (`.next/`, `coverage/`, `test-results/`) estejam devidamente ignorados no `.gitignore` e não sujem o histórico/tree do projeto.
    - Atualizar `repository`, `bugs` e `homepage` no `package.json` para o repositório `Twitter-Clone`.
    - Revisar o `npm test` (`concurrently` com `nest:dev` + `next dev`) para evitar servidores subindo sem necessidade durante o Jest e investigar o encerramento de _open handles_ sem depender de `--forceExit`.

- **PR #25: Alinhamento de Versões de Dependências e Tipagem (`React`, `TypeScript` e `ESLint`)**
  - **Escopo:** Alinhar `@types/react` e `@types/react-dom` à versão real do React (`18.3.1`) para evitar conflitos de tipos e validar a compatibilidade entre `typescript` (`^6.0.3`), `eslint` (`8.57.0`) e plugins do projeto.
- **PR #26: Documentação da API com Swagger / OpenAPI**
- **Escopo:** Configurar `@nestjs/swagger` e `SwaggerModule` no bootstrap do NestJS (`src/main.ts`) para expor a especificação OpenAPI e o Swagger UI, documentando os módulos, endpoints e DTOs da API.
