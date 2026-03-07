# CLAUDE.md — Guia de Desenvolvimento: Barber Shop Back-end

## Visao Geral do Projeto

API REST para gestao de barbearias, construida com **NestJS 11 + Prisma + MySQL**.
O sistema suporta multiplas empresas (Company), cada uma com multiplas unidades (Unit), usuarios com hierarquia de papeis, clientes, servicos, agendamentos, produtos e vendas.

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

| Model       | Descricao                                                      |
|-------------|----------------------------------------------------------------|
| Company     | Empresa dona da barbearia (CNPJ, plano, active)                |
| Unit        | Unidade/filial da empresa                                      |
| User        | Usuario do sistema com Role; pertence a Company e Unit         |
| Client      | Cliente da barbearia; pertence a Company e Unit                |
| Service     | Servico oferecido (nome, preco, duracao em minutos)            |
| Appointment | Agendamento ligando Client + Service + User(profissional)      |
| Product     | Produto da unidade com preco de custo, margem e estoque        |
| Sale        | Venda de produtos com metodo de pagamento                      |
| SaleItem    | Item de uma venda (produto + quantidade + valor)               |

Soft delete implementado via campo `deletedAt` em: User, Unit, Client, Service, Appointment.

---

## Hierarquia de Papeis (Roles)

```
SUPER_ADMIN (4) > ADMIN (3) > SUPERVISOR (2) > BARBER (1)
```

Definido em `src/modules/auth/domain/roles-hierarchy.ts`.
O `RolesGuard` compara o nivel numerico do usuario com o minimo exigido pela rota.

---

## Modulos Implementados

### auth
- **POST /auth/login** — autentica por `name + password + companyId + unitId` (LocalStrategy), retorna JWT
- `ValidateUserUseCase`: busca usuario por nome+empresa+unidade, compara senha com bcrypt
- `LoginUseCase`: gera JWT com payload `{ id, name, email, role, companyId, unitId, sub }`
- `JwtStrategy`: extrai token do header `Authorization: Bearer`, popula `request.user`
- `RolesGuard`: verifica hierarquia de roles via decorator `@Roles()`
- `JwtAuthGuard`: guard registrado globalmente via `APP_GUARD` no `AppModule`. Respeita o decorator `@Public()` para rotas abertas
- `@Public()`: decorator em `auth/presentation/decorators/public.decorator.ts` — marca rotas que nao precisam de autenticacao (ex: login)

### users
- **GET /users** — lista usuarios da mesma company+unit
- **GET /users/:id** — busca usuario por id
- **POST /users** — cria usuario (requer SUPER_ADMIN ou ADMIN)
- **PATCH /users/:id** — atualiza usuario (requer SUPER_ADMIN ou ADMIN)
- **DELETE /users/:id** — soft delete (requer SUPER_ADMIN ou ADMIN)
- Repositorio: `PrismaUserRepository` injetado como token `"UserRepository"`
- `CreateUserUseCase` injeta `BcryptService` e faz hash da senha automaticamente antes de salvar

### clients
- **GET /clients** — lista clientes filtrados por companyId + unitId do usuario logado
- **GET /clients/:id** — busca cliente por id
- **POST /clients** — cria cliente (requer SUPER_ADMIN ou ADMIN)
- **PATCH /clients/:id** — atualiza cliente (requer SUPER_ADMIN ou ADMIN)
- **DELETE /clients/:id** — deleta cliente (requer SUPER_ADMIN ou ADMIN)
- Repositorio: `PrismaClientsRepository` injetado como token `"ClientRepository"`

### services
- **GET /services** — lista servicos filtrados por companyId + unitId do usuario logado
- **GET /services/:id** — busca servico por id (requer ADMIN ou SUPER_ADMIN)
- **POST /services** — cria servico (requer ADMIN ou SUPER_ADMIN)
- **PATCH /services/:id** — atualiza servico (requer ADMIN ou SUPER_ADMIN)
- **DELETE /services/:id** — deleta servico (requer ADMIN ou SUPER_ADMIN)
- Repositorio: `PrismaServiceRepository` injetado como token `"ServicesRepository"`

### bcrypt
- `BcryptService`: wraps `bcrypt.hash` e `bcrypt.compare`
- Modulo compartilhado, exportado para auth e users

### prisma
- `PrismaService` estende `PrismaClient`
- Modulo global compartilhado

### common
- `ApiExceptionFilter`: captura `HttpException` e retorna `{ statusCode, message }` padronizado
- `InjectUserBodyInterceptor`: injeta `companyId`, `userId`, `unitId` do JWT no `request.body` automaticamente em todas as rotas autenticadas

---

## Mecanismo de Multi-tenancy

O sistema e multi-tenant por `companyId` + `unitId`. O interceptor global `InjectUserBodyInterceptor` injeta esses valores do usuario autenticado no body de todas as requisicoes. Os repositorios filtram queries por esses campos automaticamente.

---

## Convencoes do Projeto

- **Repositorios** sao injetados via string token: `@Inject("UserRepository")`, `@Inject("ClientRepository")`, `@Inject("ServicesRepository")`
- **Use Cases** sao `@Injectable()` e recebem o repositorio no construtor
- **DTOs** usam `class-validator` decorators e `PartialType` do `@nestjs/mapped-types` para updates
- **Entidades de dominio** estendem a classe `Default` (timestamps)
- **Soft delete** e padrao para Users, Clients, Units (campo `deletedAt`)
- Autenticacao local usa `name + companyId + unitId` (nao email) como identificador de login

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

## Modulos NAO Implementados (schema existe, modulo nao)

Os modelos abaixo existem no schema Prisma mas nao tem modulos NestJS:

- **Appointment** — agendamentos (modelo central do negocio)
- **Product** — produtos da unidade
- **Sale / SaleItem** — vendas de produtos
- **Unit** — unidades/filiais (sem CRUD proprio)
- **Company** — empresas (sem CRUD proprio)

---

## Inconsistencias Pendentes

- **Soft delete inconsistente**: `deleteService` e `deleteClient` usam hard delete (`prisma.delete`), enquanto `deleteUser` usa soft delete (`deletedAt`). Padronizar para soft delete em todos.

---

## Proximos Passos Sugeridos

- Implementar modulo de `Appointments` (CRUD completo)
- Implementar modulo de `Units` (CRUD, vinculado a Company)
- Implementar modulo de `Company` (CRUD para SUPER_ADMIN)
- Implementar modulo de `Products` e `Sales`
- Padronizar soft delete em clients e services
- Configurar Swagger/OpenAPI
- Adicionar testes unitarios nos use cases
