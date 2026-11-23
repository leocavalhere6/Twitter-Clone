# todo.md — Twitter Clone (Roadmap de Engenharia)

## Ações Imediatas (Pré-Pivô / Estabilização)

- **Fix #1: Estabilizar Teste de Integração (`status/get.test.js`)**
  - **Escopo:** Corrigir a asserção não-determinística de `opened_connections` em `tests/integration/api/v1/status/get.test.js` para que o `npm test` volte a passar 100% (`exit code 0`).
- **Fix #2: Refinar Cobertura de Testes & Escopo (`jest.config.js`)**
  - **Escopo:** Cobrir os caminhos não testados em `models/migrator.js` e `infra/rate-limiter.ts` e revisar `collectCoverageFrom` no `jest.config.js` (excluindo handlers HTTP de `pages/api` que são testados via rede).
- **Fix #3: Regra Arquitetural para o Pivô**
  - **Escopo:** Não remendar nem migrar arquivos `.js` soltos na estrutura atual de `pages/api`; consolidar o TypeScript estrito e a separação de camadas diretamente durante o **PR #9 (Migração para o NestJS)**.

## Fase 1: Fundação de Engenharia, Qualidade e Interface Inicial

- **PR #1: Higiene do Repositório (.gitignore & Clean Build) (Concluído)**
  - **Escopo:** Remoção de pastas compiladas e ajuste fino do `.gitignore`.
- **PR #2: Tipagem Estática (TypeScript Setup) (Concluído)**
  - **Escopo:** Configuração do `tsconfig.json` e migração gradual dos módulos de infra e models.
- **PR #3: Validação Declarativa de Schemas (Zod) (Concluído)**
  - **Escopo:** Validação estrita de payloads HTTP e variáveis de ambiente.
- **PR #4: Observabilidade e Logs Estruturados (Pino) (Concluído)**
  - **Escopo:** Substituição de `console.log` por logs em JSON integrados ao tratamento de erros.
- **PR #5: Middleware de Rate Limiting (Concluído)**
  - **Escopo:** Proteção de rotas sensíveis contra força bruta usando Redis.
- **PR #6: Interface Mínima de Front-end (Concluído)**
  - **Escopo:** Reescrever a tela inicial atual para entregar uma interface web limpa, responsiva e com identidade visual inspirada no Twitter (feed básico, layout de colunas, navegação lateral e formulário de postagem).
  - **Impacto:** Estabelece uma base visual real e funcional logo no início para validações e testes de UI.
- **PR #7: Testes End-to-End e de API (Playwright) (Concluído)**
  - **Escopo:** Configuração do runner do Playwright e criação de smoke tests automatizados e testes de rotas HTTP.
- **PR #8: Abstração de Banco de Dados (Drizzle ORM) (Concluído)**
  - **Escopo:** Adição do Drizzle ORM mantendo a performance de SQL puro com type-safety e autocompletion.

## Fase 2: O Pivo Arquitetural (Backend em NestJS)

- **PR #9: Migração para o NestJS (Fundação de Domínios)**
  - **Escopo:** Estruturação da pasta `src/` em TypeScript estrito, configuração do `DatabaseService` global e migração dos módulos base (`Status`, `Migrations`, `Users`) para o padrão de Controllers, Services e Repositories do NestJS (sem remendar a estrutura legada de `pages/api`).

## Fase 3: Identidade, Segurança e Comunicação (Diretamente no NestJS)

_(Tudo construído na nova arquitetura limpa, evitando qualquer retrabalho)_

- **PR #10: Serviço de E-mails Transacionais**
  - **Escopo:** Configuração do Mailpit no Docker e abstração de envio de templates HTML via serviços do NestJS.
- **PR #11: Perfil de Usuário & Engenharia de Senhas**
  - **Escopo:** Hash seguro de senhas com Argon2/Bcrypt e fluxo de tokens de ativação de conta por e-mail.
- **PR #12: Sistema de Autenticação**
  - **Escopo:** Endpoints de login e logout (`POST/DELETE /api/v1/sessions`) gerenciando sessões via cookies `HttpOnly`, `Secure` e `SameSite=Lax`.
- **PR #13: Sistema de Autorização (RBAC)**
  - **Escopo:** Guards e Middlewares do NestJS para proteção de rotas privadas e validação de permissões por escopo.

## Fase 4: Escalabilidade, Dados, IA e Arquitetura Avançada

- **PR #14: Desacoplamento em Microsserviços & Mensageria (RabbitMQ)**
  - **Escopo:** Quebra dos domínios do NestJS em serviços independentes (ex.: Serviço de Usuários e Serviço de Posts) comunicando-se de forma assíncrona via RabbitMQ (disparo de eventos na criação de posts para processamento em background, embeddings e notificações).
- **PR #15: Camada de Dados Não Relacionais (MongoDB)**
  - **Escopo:** Integração do MongoDB para persistência de dados com estrutura variável ou alta taxa de escrita (ex.: logs de eventos, histórico de ações ou notificações).
- **PR #16: Busca Vetorial e RAG Simples (`pgvector`)**
  - **Escopo:** Habilitação da extensão `pgvector` no PostgreSQL, geração de embeddings de posts/conteúdos via API gratuita de LLM, armazenamento vetorial e consulta por similaridade/RAG.
- **PR #17: Camada de Consulta Flexível (GraphQL)**
  - **Escopo:** Exposição de endpoint `/graphql` paralelo ao REST com queries e mutations para buscar feed, perfil e dados aninhados de forma flexível.

## Fase 5: Infraestrutura Local e IaC

- **PR #19: Orquestração Local com Kubernetes (Kind / Minikube)**
  - **Escopo:** Criação de manifests básicos (`Deployment`, `Service`, etc.) e subida/teste dos serviços em cluster Kubernetes local com Kind ou Minikube.
- **PR #20: Infraestrutura como Código (Terraform)**
  - **Escopo:** Provisionamento e gerenciamento declarativo de ambiente via Terraform (provider Docker local ou recursos simples na AWS Free Tier).

## Fase 6: Experiência Completa do Usuário (Front-end Definitivo)

- **PR #18: Desenvolvimento Completo do Front-End (Next.js)**
  - **Escopo:** Construção de todas as páginas da aplicação no Next.js (perfil, timeline em tempo real, interações, busca semântica/RAG e notificações) totalmente integradas aos serviços do NestJS.
