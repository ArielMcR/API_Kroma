# CLAUDE.md — Guia de Desenvolvimento: Barber Shop Back-end

## Visao Geral do Projeto

API REST para gestao de barbearias, construida com **NestJS 11 + Prisma + MySQL**.
O sistema atende **uma unica barbearia por instalacao** (nao e multi-tenant): usuarios com hierarquia de papeis, clientes, servicos, agendamentos, produtos e vendas existem diretamente, sem escopo de empresa/unidade.

**Stack principal:**
- Runtime: Node.js
- Framework: NestJS 11
- ORM: Prisma 6 (MySQL)
- Autenticacao: JWT + Passport (local strategy)
- Hash de senha: bcrypt
- Validacao: class-validator + class-transformer
- Package manager: pnpm

---

## Arquitetura

O projeto segue uma arquitetura em camadas inspirada em Clean Architecture / DDD:

```
Controller (presentation) -> UseCase (application) -> Repository interface (domain) -> Infra (Prisma)
```

Cada modulo de negocio segue esta estrutura interna:

```
src/modules/<modulo>/
  domain/           # Entidades, interfaces de repositorio, tipos, excecoes de dominio
  useCases/         # Casos de uso (logica de aplicacao), um arquivo por caso de uso
  presentation/
    controller/     # Controllers NestJS com rotas HTTP
    dto/            # DTOs com validacao via class-validator
    decorators/     # Decorators customizados
  infra/            # Implementacoes concretas de repositorio (Prisma)
  <modulo>.module.ts
```

---

## Estrutura de Pastas

```
back-end/
  src/
    main.ts                          # Bootstrap da aplicacao, porta 3000
    modules/
      app/                           # Modulo raiz (AppModule)
      auth/                          # Autenticacao e autorizacao
      users/                         # Gestao de usuarios
      clients/                       # Gestao de clientes
      services/                      # Gestao de servicos de barbearia
      appointments/                  # Agendamentos
      observations/                  # Observacoes por cliente
      products/                      # Produtos
      sales/                         # Vendas de produtos
      reports/                       # Relatorios e dashboard
      settings/                      # Dados da barbearia (linha unica)
      bcrypt/                        # Servico de hash de senha
      prisma/                        # Modulo compartilhado do PrismaService
      common/
        domain/default/              # Classe base Default (createdAt, updatedAt, deletedAt)
        filters/                     # ApiExceptionFilter global
        presentation/interceptors/   # InjectUserBodyInterceptor global
  prisma/
    schema.prisma                    # Schema do banco de dados
    seeds.ts                         # Seeds
    migrations/                      # Historico de migracoes
```

---

## Modelos do Banco de Dados (Prisma)

| Model        | Descricao                                                      |
|--------------|----------------------------------------------------------------|
| Settings     | Dados da barbearia (nome, CNPJ, endereco, telefone). **Linha unica** — ler sempre com `findFirst()` |
| User         | Usuario do sistema com Role                                    |
| Client       | Cliente da barbearia                                           |
| Service      | Servico oferecido (nome, preco, duracao em minutos)            |
| Appointment  | Agendamento ligando Client + Service + User(profissional)      |
| Observation  | Observacao vinculada a um Client                               |
| Product      | Produto com preco de custo, margem e estoque                   |
| Sale         | Venda de produtos com metodo de pagamento                      |
| SaleItem     | Item de uma venda (produto + quantidade + valor)               |
| LoginAttempt | Tentativas de login (rate limit / bloqueio temporario)         |
| OperationLog | Log de operacoes (duracao, sucesso) usado pelo relatorio de metricas |
| AssistantCommand | Historico de comandos em linguagem natural (Sprint 3), com status, ferramenta e duracao |
| AppointmentService | Servicos de um agendamento (**1:N**), com preco e duracao congelados na marcacao |

### Agendamento tem 1..N servicos

`Appointment` **nao tem mais `serviceId`**. Os servicos vivem em `AppointmentService`, e:

- **`durationMinutes` do agendamento e a SOMA das duracoes dos servicos.** Corte 30min + barba
  20min ocupa 50min. Quem calcula e o `CreateAppointmentUseCase`; nao aceite duracao arbitraria.
- **`unitPrice` e `durationMinutes` do item sao CONGELADOS na marcacao.** Reajustar o cadastro de
  um servico nao pode reescrever o faturamento de meses fechados — era o que acontecia antes,
  porque os relatorios liam `service.price` direto.
- **Relatorios leem os itens, nao o agendamento.** O ranking de servicos percorre
  `appointmentService` para que um atendimento de corte + barba conte uma vez para cada.
- Agendamento **sem servico nao pode existir**: o use case rejeita lista vazia antes de gravar.
- Toda leitura de agendamento traz `services` via include (`INCLUDE_SERVICOS`) — sem eles nao ha
  valor nem duracao.

O contrato mudou: `POST /appointments` recebe **`serviceIds: number[]`** no lugar de `serviceId`.

Soft delete implementado via campo `deletedAt` em: User, Client, Service, Appointment, Observation.

`Settings` nao tem nenhuma FK apontando para ela — nenhuma outra tabela e escopada por ela.

---

## Hierarquia de Papeis (Roles)

```
ADMIN (3) > SUPERVISOR (2) > BARBER (1)
```

O `RolesGuard` compara `roleHierarchy[user.role] >= Math.min(...papeis exigidos)`, ou seja
`@Roles('SUPERVISOR')` libera SUPERVISOR **e todos acima**. Nao liste papeis superiores
junto — basta declarar o papel minimo.

Definido em `src/modules/auth/domain/roles-hierarchy.ts`.

---

## Modulos Implementados

### auth

**POST /auth/login** — fluxo unico:

| Body | Resposta |
|------|----------|
| `{ name, password }` | `{ access_token, settings, user }` |

- `ValidateUserUseCase`: busca usuario por `name`, valida senha com bcrypt e aplica bloqueio
  temporario (5 falhas em 15 min -> HTTP 429, via tabela `LoginAttempt`)
- `LoginUseCase`: assina o JWT e devolve os dados da barbearia (`Settings`).
  Payload do JWT: `{ sub, id, name, email, role }`
- `LocalStrategy`: `usernameField: 'name'`, `passwordField: 'password'`
- `JwtStrategy`: extrai token do header `Authorization: Bearer`, popula `request.user`
- **GET /auth/me** — `{ user, settings }`
- **PATCH /auth/change-password**
- `RolesGuard`: verifica hierarquia de roles via decorator `@Roles()`
- `JwtAuthGuard`: guard registrado globalmente via `APP_GUARD` no `AppModule`. Respeita o decorator `@Public()` para rotas abertas
- `@Public()`: decorator em `auth/presentation/decorators/public.decorator.ts` — marca rotas que nao precisam de autenticacao (ex: login)

### users
- **GET /users** — lista usuarios
- **GET /users/:id** — busca usuario por id
- **POST /users** — cria usuario (requer ADMIN)
- **PATCH /users/:id** — atualiza usuario (requer ADMIN)
- **DELETE /users/:id** — soft delete (requer ADMIN)
- Repositorio: `PrismaUserRepository` injetado como token `"UserRepository"`
- `CreateUserUseCase` injeta `BcryptService` e faz hash da senha automaticamente antes de salvar

### clients
- **GET /clients** — lista clientes
- **GET /clients/:id** — busca cliente por id
- **POST /clients** — cria cliente (requer SUPERVISOR+)
- **PATCH /clients/:id** — atualiza cliente (requer SUPERVISOR+)
- **DELETE /clients/:id** — soft delete (requer SUPERVISOR+)
- Repositorio: `PrismaClientsRepository` injetado como token `"ClientRepository"`

### services
- **GET /services** — lista servicos
- **GET /services/:id** — busca servico por id (requer ADMIN)
- **POST /services** — cria servico (requer ADMIN)
- **PATCH /services/:id** — atualiza servico (requer ADMIN)
- **DELETE /services/:id** — soft delete (requer ADMIN)
- Repositorio: `PrismaServiceRepository` injetado como token `"ServicesRepository"`

### settings
- **GET /settings** — dados da barbearia (qualquer usuario autenticado)
- **PATCH /settings** — atualiza os dados (requer ADMIN)
- Tabela de linha unica: o repositorio usa `findFirst()` e atualiza pelo id encontrado
- Repositorio: `PrismaSettingsRepository` injetado como token `"SettingsRepository"`

### appointments, observations, products, sales, reports
Todos com CRUD completo seguindo o mesmo padrao de camadas.
`reports` expoe `/reports/attendance`, `/services`, `/revenue`, `/dashboard` e `/metrics`,
todos parametrizados apenas por periodo (`?from=&to=`).

### assistant (Sprint 3 — interface em linguagem natural)

- **POST /assistant/command** — `{ text }` -> `{ response, toolExecuted, status, commandId }`
- **POST /assistant/command/audio** — multipart, campo `audio` -> o mesmo + `transcription`
- **GET /assistant/history?limit=** — historico do usuario autenticado
- Sem `@Roles`: qualquer usuario autenticado usa (RN17)

**Voz e so um adaptador.** `executeAudio` transcreve e chama o MESMO `execute` do texto — nao ha
segundo cerebro. Multipart em vez de base64 em JSON porque o body parser do Nest limita JSON a
100 kB e qualquer audio real estouraria. A transcricao virou o `rawText` gravado (mantem as
metricas analisaveis) e volta na resposta para o chat mostrar o que foi ouvido.

**Dois modelos configuraveis:** `GEMINI_MODEL` interpreta e redige; `GEMINI_TRANSCRIPTION_MODEL`
so transcreve. Ambos usam `gemini-3.1-flash-lite` por causa da **cota diaria**: no plano gratuito o
`gemini-3.5-flash` da apenas **20 requisicoes por dia** (~10 comandos de texto), enquanto o
flash-lite da 500 — e ainda e mais rapido (texto 1,5-3,2s contra 1,4-10s; transcricao 2,2s contra
7,7s). Comando de voz gasta **3** chamadas contra 2 do texto. Conferir o RPD em
<https://ai.dev/rate-limit> antes de apresentar: o limite diario nao se recupera esperando.

O `ProcessCommandUseCase` manda o texto ao Gemini com 4 function declarations, executa a funcao
escolhida chamando os **mesmos use cases** dos outros modulos e devolve o resultado ao modelo para
virar frase. Nao reimplementa nenhuma regra — e assim que as validacoes continuam valendo (RN18).

**As 4 funcoes sao a superficie inteira:** `QUERY_SCHEDULE`, `CREATE_APPOINTMENT`,
`REGISTER_CLIENT`, `GENERATE_REPORT`. Nao existe funcao de exclusao ou troca de senha — a RN20 e
cumprida por ausencia. **Ao adicionar uma funcao nova, nunca exponha operacao destrutiva.**

**Erro de negocio nao e erro de sistema.** Excecao vinda de um use case e capturada em volta de
`executarFuncao`, devolvida ao Gemini como `functionResponse` e virada frase; grava
`EXECUTION_ERROR` **com `toolExecuted` preenchido**. O `catch` externo trata so falha de infra
(Gemini fora, 429, timeout) e grava com `toolExecuted: null`. Essa distincao e o que faz
"agenda pra terca" responder "so atendemos sexta e sabado" em vez de "erro, tente novamente".

**Todo comando e gravado em `AssistantCommand`**, inclusive os que falharam — e a base das metricas
de avaliacao do TCC (§7 do PRD).

**Gemini:** SDK `@google/genai` (o `@google/generative-ai` do PRD esta descontinuado). No SDK atual
`response.functionCalls` e `response.text` sao **getters, nao metodos**. `GeminiClient` aceita
`GEMINI_API_KEY` ou `GOOGLE_GEMINI_API_KEY`, tolera chave ausente sem derrubar o boot (RNF09) e
aplica `thinkingConfig: { thinkingBudget: 0 }` — sem isso os modelos flash 2.5+ passam de 20s.

Desvios em relacao ao PRD estao consolidados em [PRD/PRD_SPRINT3_LLM_MCP.md](PRD/PRD_SPRINT3_LLM_MCP.md) §11.

### bcrypt
- `BcryptService`: wraps `bcrypt.hash` e `bcrypt.compare`
- Modulo compartilhado, exportado para auth e users

### prisma
- `PrismaService` estende `PrismaClient`
- Modulo global compartilhado

### common
- `ApiExceptionFilter`: captura `HttpException` e retorna `{ statusCode, message }` padronizado
- `InjectUserBodyInterceptor`: injeta `userId` do JWT no `request.body` automaticamente em todas as rotas autenticadas
- `OperationLogInterceptor`: grava duracao/sucesso das operacoes na tabela `OperationLog`

---

## Instalacao unica (sem multi-tenancy)

O sistema **nao e multi-tenant**. Nao existe `companyId`/`unitId` em lugar nenhum: os
repositorios consultam as tabelas diretamente, sem filtro de escopo. Os dados da barbearia
ficam em `Settings` (linha unica) e nenhuma tabela referencia essa linha.

Ao adicionar um model novo, **nao** crie coluna de escopo — a instalacao inteira e uma
barbearia so.

O `InjectUserBodyInterceptor` continua injetando `userId` no body (usado para `creatorUserId`
e autoria). Repositorios que recebem o body inteiro removem esse campo antes de passar ao
Prisma (`delete data.userId`) ou projetam explicitamente os campos que persistem.

---

## Convencoes do Projeto

- **Repositorios** sao injetados via string token: `@Inject("UserRepository")`, `@Inject("ClientRepository")`, `@Inject("ServicesRepository")`, `@Inject("SettingsRepository")`
- **Use Cases** sao `@Injectable()` e recebem o repositorio no construtor
- **DTOs** usam `class-validator` decorators e `PartialType` do `@nestjs/mapped-types` para updates
- **Entidades de dominio** estendem a classe `Default` (timestamps)
- **Soft delete** e padrao para Users, Clients, Services, Appointments (campo `deletedAt`)
- Autenticacao local usa `name` (nao email) como identificador de login

---

## Scripts

```bash
pnpm start:dev          # desenvolvimento com watch
pnpm build              # build de producao
pnpm prisma:generate    # gera o Prisma Client
pnpm prisma:migrate     # roda migracoes
pnpm prisma:seed        # executa seeds
pnpm test               # testes unitarios
pnpm test:e2e           # testes e2e
```

---

## Inconsistencias Pendentes

- **Soft delete inconsistente**: `deleteProduct` e `deleteSale` usam hard delete
  (`prisma.delete`), enquanto users/clients/services/appointments usam soft delete
  (`deletedAt`). Padronizar ao mexer nesses modulos.

---

## Proximos Passos Sugeridos

- Padronizar soft delete em products e sales
- Configurar Swagger/OpenAPI
- Ampliar a cobertura de testes unitarios nos use cases
