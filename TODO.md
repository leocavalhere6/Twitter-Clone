# todo.md — Twitter Clone (Roadmap de Engenharia)

## Ações Imediatas (Pré-Pivô / Estabilização) — Concluído

- **Fix #1: Estabilizar Teste de Integração (`status/get.test.js`) (Concluído)**
- **Fix #2: Refinar Cobertura de Testes & Escopo (`jest.config.js`) (Concluído)**
- **Fix #3: Regra Arquitetural para o Pivô (Concluído)**

## Fase 1: Fundação de Engenharia, Qualidade e Interface Inicial — Concluído

- **PR #1: Higiene do Repositório (.gitignore & Clean Build) (Concluído)**
- **PR #2: Tipagem Estática (TypeScript Setup) (Concluído)**
- **PR #3: Validação Declarativa de Schemas (Zod) (Concluído)**
- **PR #4: Observabilidade e Logs Estruturados (Pino) (Concluído)**
- **PR #5: Middleware de Rate Limiting (Concluído)**
- **PR #6: Interface Mínima de Front-end (Concluído)**
- **PR #7: Testes End-to-End e de API (Playwright) (Concluído)**
- **PR #8: Abstração de Banco de Dados (Drizzle ORM) (Concluído)**

## Fase 2: O Pivô Arquitetural (Backend em NestJS) — Concluído

- **PR #9: Migração para o NestJS (Fundação de Domínios) (Concluído)**
  - **Escopo entregue:** Estruturação da pasta `src/` em TypeScript estrito, `DatabaseService`, `MailService`, filtros de exceção, pipes com Zod e módulos `Status`, `Migrations` e `Users` (`src/modules/`), mantendo coexistência com as rotas HTTP em `pages/api/v1/` e modelos compartilhados em `models/`.

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

## Fase 4: Escalabilidade, Dados, IA e Arquitetura Avançada (Monolito Modular)

- **PR #14: Módulo de Posts & Mensageria Assíncrona (RabbitMQ)**
  - **Escopo:** Manter o monolito modular em NestJS (evitando o overhead operacional de múltiplos microsserviços separados), adicionando o módulo `Posts` (`src/modules/posts/`) e infraestrutura RabbitMQ (`src/infra/messaging/`) para publicar eventos como `post.created` e consumir tarefas em background de forma assíncrona (geração de embeddings, auditoria/logs e notificações).
- **PR #15: Camada de Dados Não Relacionais (MongoDB)**
  - **Escopo:** Manter o PostgreSQL + Drizzle ORM como banco principal transacional e integrar MongoDB (`src/infra/mongodb/`) de forma complementar e não bloqueante para dados de alta escrita ou schema flexível (ex.: `activity_logs` de eventos/auditoria e `notifications`).
- **PR #16: Busca Vetorial e RAG Simples (`pgvector` + IA Gratuita)**
  - **Escopo:** Habilitar `pgvector` no PostgreSQL existente via migration, armazenar embeddings dos posts (gerados no fluxo assíncrono do PR #14 usando camada de serviço desacoplada sobre API gratuita de LLM, como Gemini free tier e expor busca por similaridade vetorial (`<=>`) / RAG simples em cima dos conteúdos.
- **PR #17: Camada de Consulta Flexível (GraphQL)**
  - **Escopo:** Expor endpoint `/graphql` no NestJS paralelo ao REST, com queries e mutations reutilizando os mesmos services dos módulos (feed, perfil, posts, busca semântica e dados aninhados) sem duplicar regras de negócio.

## Fase 5: Infraestrutura Local e IaC

- **PR #19: Orquestração Local com Kubernetes (Kind / Minikube)**
  - **Escopo:** Criar manifests básicos (`Deployment`, `Service`, etc.) e subir/testar a stack em cluster Kubernetes local com Kind ou Minikube.
- **PR #20: Infraestrutura como Código (Terraform)**
  - **Escopo:** Provisionar e gerenciar ambiente de forma declarativa via Terraform (provider Docker local).

## Fase 6: Experiência Completa do Usuário (Front-end Definitivo)

- **PR #18: Desenvolvimento Completo do Front-End (Next.js)**
  - **Escopo:** Construir as páginas completas da aplicação no Next.js (perfil, timeline em tempo real, interações, busca semântica/RAG e notificações) integradas aos serviços do NestJS.
