Fase 1: Fundação de Engenharia, Qualidade e Interface Inicial
PR #1: Higiene do Repositório (.gitignore & Clean Build) (Concluído)

Escopo: Remoção de pastas compiladas e ajuste fino do .gitignore.

PR #2: Tipagem Estática (TypeScript Setup) (Concluído)

Escopo: Configuração do tsconfig.json e migração gradual dos módulos de infra e models.

PR #3: Validação Declarativa de Schemas (Zod) (Concluído)

Escopo: Validação estrita de payloads HTTP e variáveis de ambiente.

PR #4: Observabilidade e Logs Estruturados (Pino) (Concluído)

Escopo: Substituição de console.log por logs em JSON integrados ao tratamento de erros.

PR #5: Middleware de Rate Limiting (Concluído)

Escopo: Proteção de rotas sensíveis contra força bruta usando Redis.

PR #6: Interface Mínima de Front-end

Escopo: Reescrever a tela inicial atual para entregar uma interface web limpa, responsiva e com identidade visual inspirada no Twitter (feed básico, layout de colunas, navegação lateral e formulário de postagem).

Impacto: Estabelece uma base visual real e funcional logo no início para validações e testes de UI.

PR #7: Testes End-to-End e de API (Playwright)

Escopo: Configuração do runner do Playwright e criação de smoke tests automatizados e testes de rotas HTTP.

PR #8: Abstração de Banco de Dados (Drizzle ORM)

Escopo: Adição do Drizzle ORM mantendo a performance de SQL puro com type-safety e autocompletion.

Fase 2: O Pivo Arquitetural (Backend em NestJS)
PR #9: Migração para o NestJS (Fundação de Domínios)

Escopo: Estruturação da pasta src/, configuração do DatabaseService global e migração dos módulos base (Status, Migrations, Users) para o padrão de Controllers, Services e Repositories do NestJS.

Fase 3: Identidade, Segurança e Comunicação (Diretamente no NestJS)
(Tudo construído na nova arquitetura limpa, evitando qualquer retrabalho)

PR #10: Serviço de E-mails Transacionais

Escopo: Configuração do Mailpit no Docker e abstração de envio de templates HTML via serviços do NestJS.

PR #11: Perfil de Usuário & Engenharia de Senhas

Escopo: Hash seguro de senhas com Argon2/Bcrypt e fluxo de tokens de ativação de conta por e-mail.

PR #12: Sistema de Autenticação

Escopo: Endpoints de login e logout (POST/DELETE /api/v1/sessions) gerenciando sessões via cookies HttpOnly, Secure e SameSite=Lax.

PR #13: Sistema de Autorização (RBAC)

Escopo: Guards e Middlewares do NestJS para proteção de rotas privadas e validação de permissões por escopo.

Fase 4: Escalabilidade e Arquitetura Avançada
PR #14: Desacoplamento em Microsserviços

Escopo: Quebra dos domínios do NestJS em serviços independentes (ex: Serviço de Usuários e Serviço de Posts) comunicando-se de forma assíncrona via mensageria (RabbitMQ).

Fase 5: Experiência Completa do Usuário (Front-end Definitivo)
PR #15: Desenvolvimento Completo do Front-End (Next.js)

Escopo: Construção de todas as páginas da aplicação no Next.js (perfil, timeline em tempo real, interações, notificações) totalmente integradas aos microsserviços do NestJS.
