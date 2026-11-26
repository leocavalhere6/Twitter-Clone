# Lista de Conceitos Técnicos para Revisão

## 1. Fundamentos de Engenharia de Software, Arquitetura e System Design

- **POO (Programação Orientada a Objetos):** Encapsulamento, herança, polimorfismo e abstração.
- **SOLID:** Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation e Dependency Inversion.
- **Inversão de Dependência (DIP — Dependency Inversion Principle):** Módulos de alto nível não devem depender de módulos de baixo nível; ambos devem depender de abstrações.
- **Injeção de Dependência (DI — Dependency Injection):** Fornecer as dependências de uma classe/módulo de fora (ex.: via construtor) em vez de instanciá-las internamente, muitas vezes gerenciada por um container de IoC (Inversion of Control) em NestJS e Spring Boot.
- **Práticas de Qualidade de Código:** KISS (Keep It Simple, Stupid), YAGNI (You Aren't Gonna Need It) e DRY (Don't Repeat Yourself).
- **Design Patterns:** Repository, Factory, Strategy, Singleton, Adapter e Decorator (uso prático em NestJS/Spring).
- **MVC (Model-View-Controller):** Separação entre dados/regras de negócio, interface e controle de fluxo de entrada.
- **Arquitetura em Camadas (Layered Architecture):** Separação entre Controller, Service/Use Case, Repository e Domain/Model.
- **Monólito Modular:** Fronteiras claras de domínio dentro de um único deploy, sem complexidade de rede distribuída.
- **Microsserviços:** Serviços independentes, comunicação via rede e trade-offs operacionais.
- **DDD (Domain-Driven Design):** Bounded Contexts, Entidades, Value Objects, Aggregates, Repositories e Ubiquitous Language.
- **System Design (Bê-á-bá):** Escalabilidade vertical vs. horizontal, Load Balancer, Cache, filas assíncronas, índices/particionamento básico de banco, latência vs. throughput e comunicação síncrona vs. assíncrona.

## 2. IA, LLMs e Busca Vetorial

- **LLMs:** Funcionamento básico, tokens, janela de contexto e geração probabilística.
- **Pré-treino vs. Fine-Tuning vs. Prompt Engineering:** Diferença de objetivo, custo e adaptação de comportamento.
- **RLHF (Reinforcement Learning from Human Feedback):** Avaliação humana (precisão, lógica, segurança) gerando sinais de alinhamento.
- **Embeddings:** Representação vetorial de texto para captura de significado semântico.
- **RAG (Retrieval-Augmented Generation):** Embedding da consulta, busca por similaridade e injeção de contexto no prompt.
- **pgvector:** Armazenamento de vetores e cálculo de similaridade (cosseno / produto interno) no PostgreSQL.

## 3. Backend, APIs e Comunicação

- **Middleware:** Interceptação de requisições antes da rota para autenticação, logs, parsing ou bloqueio.
- **Arquitetura NestJS (Request Lifecycle):** Middlewares → Guards → Interceptors → Pipes → Controllers → Services → Exception Filters.
- **REST:** Recursos, verbos HTTP, status codes, statelessness e idempotência.
- **GraphQL:** Schema, Queries, Mutations, Resolvers e prevenção de over-fetching/under-fetching.
- **Validação de Schema (Zod):** Validação em tempo de execução (runtime) versus tipagem em compilação (compile-time).
- **Spring Boot & Spring Security:** SecurityFilterChain, Beans, Controllers, Services e Spring Data JPA.
- **Clientes HTTP & Integração Externa (`AuthorizerClient` / `NotificationClient`):** Comunicação síncrona entre serviços, serialização DTO, tratamento de falhas e resiliência.
- **E-mail Transacional (`MailService` & `Mailpit`):** Fluxos de ativação de conta e boas-vindas via SMTP, templates e captura local em ambiente de desenvolvimento.
- **Health Checks (`/health` & `/status`):** Monitoramento da saúde da API, conexões com banco de dados e dependências para containers e orquestradores.
- **OpenAPI / Swagger:** Contrato de API, documentação de endpoints, payloads e respostas.

## 4. Segurança e Resiliência

- **Session-based Auth (`HttpOnly Cookies`):** Estado de sessão no servidor/Redis, envio automático pelo navegador e revogação imediata.
- **JWT (Stateless Auth):** Token assinado (Header, Payload, Signature), validação sem estado e trade-offs de expiração/revogação.
- **Autorização Granular / RBAC (`FeaturesGuard` & `@RequireFeatures`):** Separação entre autenticação (quem é o usuário) e autorização (o que ele pode fazer).
- **Hashing de Senhas (`Argon2`):** Hash unidirecional com salt e resistência a ataques de GPU/força bruta.
- **Segurança Web (`HttpOnly` & `SameSite`):** Mitigação contra XSS e CSRF.
- **Rate Limiting:** Controle de taxa de requisições por IP/usuário contra abuso e sobrecarga.
- **Logging Estruturado (`Pino`) e Exception Handling:** Logs em JSON para observabilidade e filtros globais (`DomainExceptionFilter` / `GlobalExceptionHandler`) para não vazar stack traces.

## 5. Bancos de Dados, ORM e Mensageria

- **SQL:** Modelo relacional, schema rígido, joins e consultas declarativas.
- **PostgreSQL:** Banco relacional, índices, transações, JSONB e extensão vetorial (`pgvector`).
- **NoSQL:** Modelos não relacionais (documento, chave-valor), schema flexível e escala horizontal.
- **MongoDB:** Banco orientado a documentos (BSON), alta taxa de escrita e logs/dados não estruturados.
- **ACID:** Atomicidade, Consistência, Isolamento e Durabilidade.
- **Transações Financeiras:** Controle de concorrência, bloqueios (locks), saldo consistente, validação de regras de negócio e prevenção de race conditions.
- **ORM (`Drizzle ORM` & `Spring Data JPA`):** Mapeamento objeto-relacional, query builders vs. abstração de entidades e problema N+1.
- **Migrations (`node-pg-migrate` & `Flyway`):** Versionamento incremental e reprodutível de alterações de schema.
- **Redis:** Armazenamento em memória, Cache-Aside, TTL, invalidação de cache, sessões e rate limit.
- **RabbitMQ:** Mensageria assíncrona com Producers, Exchanges, Queues, Consumers e eventos (ex.: `post.created`).

## 6. Linguagens e Frontend

- **JavaScript / Node.js Runtime:** Event Loop, Call Stack, Microtask/Callback Queue, I/O não-bloqueante e `async/await`.
- **TypeScript:** Tipagem estrutural, interfaces, types, generics e segurança em compile-time.
- **Java 21 & JVM:** Tipagem estática forte, bytecode, Garbage Collector, `records`, `var`, coleções/streams e tratamento de exceções (`try-with-resources`, checked/unchecked).
- **Python:** Tipagem dinâmica, sintaxe por indentação, estruturas nativas (`list`, `dict`, `set`, `tuple`), funções, módulos/ambientes virtuais (`venv`), scripts, manipulação de dados e ecossistema de IA.
- **React:** JSX, componentização, props (somente leitura), estado (`useState`), efeitos/ciclo (`useEffect`), renderização condicional/listas, eventos de formulário e re-renderização.
- **Data Fetching (`SWR`):** Cache de dados no cliente, revalidação automática e estados de loading/erro.
- **Next.js (Pages Router):** Roteamento por arquivos em `pages/`, CSR (Client-Side Rendering), SSR (Server-Side Rendering) e API Routes.
- **Angular:** Arquitetura opinionada com componentes e templates (interpolação/diretivas/eventos), serviços, injeção de dependência, roteamento e RxJS/Observables.

## 7. Cloud, DevOps e Infraestrutura como Código

- **Docker & Docker Compose:** Imagens, containers, camadas de build, volumes, redes, readiness/wait scripts e orquestração local.
- **Kubernetes (`Kind`):** Cluster, Node, Pod, Deployment, Service, ConfigMap e Secret.
- **Terraform:** Infraestrutura declarativa, state, providers e fluxo `init / plan / apply`.
- **AWS — IAM:** Usuários, roles, policies e princípio do menor privilégio.
- **AWS — VPC:** Subnets públicas/privadas, Route Tables, Internet Gateway e Security Groups.
- **AWS — Computação e Escala:** EC2 (VMs), ECS (containers), ELB (load balancer) e Auto Scaling.
- **AWS — Armazenamento e Banco:** S3 (objetos), EFS (sistema de arquivos) e RDS (banco relacional gerenciado).

## 8. Testes, Qualidade e Entrega Contínua

- **Smoke Tests:** Verificação rápida de sanidade em rotas críticas e serviços essenciais após build ou deploy.
- **Testes Unitários (`Jest` & `JUnit`):** Isolamento de unidade de código com mocks e stubs.
- **Testes de Integração:** Validação da interação real entre aplicação, banco de dados e APIs.
- **Testes E2E (`Playwright`):** Simulação completa da jornada do usuário no navegador.
- **Cobertura de Código (`JaCoCo`):** Métricas de instruções, branches, classes e métodos cobertos — e diferença entre cobertura e qualidade de asserções.
- **Governança de Código & Git Hooks (`ESLint`, `Prettier`, `Spotless`, `Husky`, `Commitlint`):** Formatação automática, análise estática, Conventional Commits e automação com `Makefile`/scripts.
- **CI/CD (`GitHub Actions`):** Automação de lint, type-check, testes e validação em push/pull request.
