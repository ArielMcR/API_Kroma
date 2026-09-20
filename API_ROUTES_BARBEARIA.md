# Documentação de Rotas da API - Escopo Barbearia

Este documento consolida as rotas dos módulos:
- clients
- services
- appointments
- products
- sales
- settings
- users

Base URL local:
- `http://localhost:3000`

## Regras Gerais

### Autenticação
- A API usa JWT Bearer Token globalmente.
- Todas as rotas abaixo exigem `Authorization: Bearer <token>`.
- Exceções públicas (ex.: login) não fazem parte deste documento.

### Controle de acesso por perfil
Hierarquia de papéis (maior para menor):
- `ADMIN` (3)
- `SUPERVISOR` (2)
- `BARBER` (1)

O acesso é **por nível mínimo**: uma rota marcada como `SUPERVISOR` também aceita `ADMIN`.
Cada endpoint abaixo indica o papel mínimo exigido.

### Instalação única (sem companyId/unitId)
A API atende **uma barbearia por instalação**. Não existe `companyId`/`unitId` em nenhuma
rota, body ou resposta — não envie esses campos.

O interceptor global injeta apenas `userId` no `body` das requisições autenticadas.

### Formato de erro
Filtro global retorna erros no formato:

```json
{
  "statusCode": 400,
  "message": "Mensagem do erro"
}
```

## 1) Clients
Prefixo: `/clients`

### GET /clients
- Descrição: Lista todos os clientes não deletados.
- Acesso: autenticado
- Body: não usa
- Resposta `200`:

```json
[
  {
    "id": 1,
    "name": "João",
    "lastName": "Silva",
    "cellPhone": "11999999999",
    "createdAt": "2026-04-03T12:00:00.000Z",
    "updatedAt": "2026-04-03T12:00:00.000Z",
    "deletedAt": null
  }
]
```

### GET /clients/:id
- Descrição: Busca cliente por ID.
- Acesso: autenticado
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200`: objeto `Client`
- Erros comuns:
  - `404` se não encontrar

### POST /clients
- Descrição: Cria cliente.
- Acesso: `SUPERVISOR`
- Body:

```json
{
  "name": "João",
  "lastName": "Silva",
  "cellPhone": "11999999999"
}
```

Campos:
- `name` (string, obrigatório)
- `lastName` (string, **opcional** desde 2026-09-20 — a coluna sempre foi `String?`; antes a validação exigia)
- `cellPhone` (string, obrigatório)

Resposta `201/200`: objeto `Client` criado.

### PATCH /clients/:id
- Descrição: Atualiza cliente (parcial).
- Acesso: `SUPERVISOR`
- Parâmetros:
  - `id` (number, obrigatório)
- Body: qualquer subconjunto de `CreateClientDTO`
- Resposta `200`: objeto atualizado

### DELETE /clients/:id
- Descrição: Exclui cliente (soft delete).
- Acesso: `SUPERVISOR`
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200/204`: sem conteúdo
- Observação:
  - Implementação atual faz **soft delete** (`deletedAt = now`).

---

## 2) Services
Prefixo: `/services`

### GET /services
- Descrição: Lista todos os serviços com `deletedAt = null`.
- Acesso: autenticado
- Resposta `200`:

```json
[
  {
    "id": 1,
    "name": "Corte",
    "price": 45,
    "durationMinutes": 40,
    "createdAt": "2026-04-03T12:00:00.000Z",
    "updatedAt": "2026-04-03T12:00:00.000Z",
    "deletedAt": null
  }
]
```

### GET /services/:id
- Descrição: Busca serviço por ID.
- Acesso: `ADMIN`
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200`: objeto `Service` ou `null` (conforme implementação atual)

### POST /services
- Descrição: Cria serviço.
- Acesso: `ADMIN`
- Body:

```json
{
  "name": "Barba",
  "price": 35,
  "durationMinutes": 30
}
```

Campos:
- `name` (string, obrigatório)
- `price` (number, obrigatório)
- `durationMinutes` (number, obrigatório)

Resposta `201/200`: objeto criado (campos selecionados: `id`, `name`, `price`, `durationMinutes`).

### PATCH /services/:id
- Descrição: Atualiza serviço (parcial).
- Acesso: `SUPERVISOR`
- Parâmetros:
  - `id` (number, obrigatório)
- Body: parcial de `CreateServiceDTO`
- Resposta `200`: objeto atualizado

### DELETE /services/:id
- Descrição: Exclui serviço (soft delete).
- Acesso: `SUPERVISOR`
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200/204`: sem conteúdo
- Observação:
  - Implementação atual faz **soft delete** (`deletedAt = now`).

---

## 3) Appointments
Prefixo: `/appointments`

### GET /appointments
- Descrição: Lista agendamentos do profissional autenticado (`professionalId = user.id`) com `deletedAt = null` e `status != CANCELLED`.
- Acesso: autenticado
- Resposta `200`:

```json
[
  {
    "id": 1,
    "clientId": 10,
    "serviceId": 3,
    "professionalId": 7,
    "appointmentDate": "2026-04-03T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "14:40",
    "status": "SCHEDULED",
    "createdAt": "2026-04-03T12:00:00.000Z",
    "updatedAt": "2026-04-03T12:00:00.000Z",
    "deletedAt": null
  }
]
```

### GET /appointments/:id
- Descrição: Busca agendamento por ID.
- Acesso: autenticado
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200`: objeto `Appointment`
- Observação técnica:
  - A camada de repositório tenta retornar `404` para não encontrado, mas há `catch` genérico que pode retornar `500`.

### POST /appointments
- Descrição: Cria agendamento.
- Acesso: autenticado
- Body:

```json
{
  "clientId": 10,
  "serviceId": 3,
  "professionalId": 7,
  "appointmentDate": "2026-04-10",
  "startTime": "14:00",
  "endTime": "14:40",
  "status": "SCHEDULED"
}
```

Campos:
- `clientId` (number, obrigatório)
- `serviceId` (number, obrigatório)
- `professionalId` (number, obrigatório)
- `appointmentDate` (string ISO date, obrigatório)
- `startTime` (string, obrigatório)
- `endTime` (string, obrigatório)
- `status` (string, obrigatório)

Resposta `201/200`: objeto `Appointment` criado.

### PATCH /appointments/:id
- Descrição: Atualiza agendamento (parcial).
- Acesso: `BARBER` (nível mínimo — ADMIN e SUPERVISOR também podem)
- Parâmetros:
  - `id` (number, obrigatório)
- Body: parcial de `CreateAppointmentDto`
- Resposta `200`: objeto atualizado
- Regras:
  - Um `BARBER` só edita agendamentos em que `professionalId` é o próprio usuário logado — editar o de outro profissional retorna `403`.
  - Campos de cancelamento/cobrança (`cancelledAt`, `cancelledLate`, `chargeRegistered`, `chargeAmount`) e `status` não são aceitos por esta rota — quem escreve neles é `POST /appointments/:id/cancel` e `POST /appointments/:id/complete`.

### DELETE /appointments/:id
- Descrição: Exclui agendamento (soft delete).
- Acesso: `ADMIN`
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200/204`: sem conteúdo
- Observação:
  - Implementação atual faz **soft delete** (`deletedAt = now`).

---

## 4) Products
Prefixo: `/products`

### GET /products
- Descrição: Lista todos os produtos.
- Acesso: autenticado
- Resposta `200`:

```json
[
  {
    "id": 1,
    "name": "Pomada Modeladora",
    "unitPrice": 20,
    "profitPercentage": 50,
    "salePrice": 30,
    "stock": 12,
    "createdAt": "2026-04-03T12:00:00.000Z",
    "updatedAt": "2026-04-03T12:00:00.000Z"
  }
]
```

### GET /products/:id
- Descrição: Busca produto por ID.
- Acesso: autenticado
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200`: objeto `Product`
- Erros comuns:
  - `404` se não encontrar

### POST /products
- Descrição: Cria produto.
- Acesso: `ADMIN`
- Body:

```json
{
  "name": "Pomada",
  "unitPrice": 20,
  "profitPercentage": 50,
  "salePrice": 30,
  "stock": 10
}
```

Campos:
- `name` (string, obrigatório)
- `unitPrice` (number, obrigatório)
- `profitPercentage` (number, obrigatório)
- `salePrice` (number, obrigatório)
- `stock` (number, opcional)

Resposta `201/200`: objeto `Product` criado.

### PATCH /products/:id
- Descrição: Atualiza produto (parcial).
- Acesso: `ADMIN`
- Parâmetros:
  - `id` (number, obrigatório)
- Body: parcial de `CreateProductDto`
- Resposta `200`: objeto atualizado

### DELETE /products/:id
- Descrição: Remove produto.
- Acesso: `ADMIN`
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200/204`: sem conteúdo
- Observação:
  - Atualmente a implementação faz **hard delete**.

---

## 5) Sales
Prefixo: `/sales`

### GET /sales
- Descrição: Lista todas as vendas, incluindo itens.
- Acesso: autenticado
- Resposta `200`:

```json
[
  {
    "id": 1,
    "clientId": 10,
    "saleDate": "2026-04-03T12:00:00.000Z",
    "totalAmount": 90,
    "paymentMethod": "PIX",
    "items": [
      {
        "id": 101,
        "saleId": 1,
        "productId": 5,
        "quantity": 3,
        "unitPrice": 30,
        "totalAmount": 90
      }
    ],
    "createdAt": "2026-04-03T12:00:00.000Z",
    "updatedAt": "2026-04-03T12:00:00.000Z"
  }
]
```

### GET /sales/:id
- Descrição: Busca venda por ID, incluindo itens.
- Acesso: autenticado
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200`: objeto `Sale` com `items`
- Erros comuns:
  - `404` se não encontrar

### POST /sales
- Descrição: Cria venda e itens; calcula `unitPrice` (a partir de `Product.salePrice`) e `totalAmount` automaticamente.
- Acesso: autenticado
- Body:

```json
{
  "clientId": 10,
  "paymentMethod": "PIX",
  "items": [
    { "productId": 5, "quantity": 2 },
    { "productId": 7, "quantity": 1 }
  ]
}
```

Campos:
- `clientId` (number | null, opcional)
- `paymentMethod` (string, obrigatório)
- `items` (array, obrigatório)
  - `productId` (number, obrigatório)
  - `quantity` (number, obrigatório)

Resposta `201/200`: objeto `Sale` criado com `items`.

Erros comuns:
- `404` se algum `productId` não existir

### DELETE /sales/:id
- Descrição: Remove venda por ID.
- Acesso: autenticado
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200/204`: sem conteúdo
- Observação:
  - Atualmente a implementação faz **hard delete**.

---

## 6) Settings
Prefixo: `/settings`

> Dados da barbearia. A tabela tem **uma unica linha** — nao ha `:id` nas rotas.

### GET /settings
- Descrição: Retorna os dados da barbearia.
- Acesso: autenticado (qualquer papel)
- Body: não usa
- Resposta `200`:

```json
{
  "id": 1,
  "tradeName": "Barbearia Exemplo",
  "legalName": "Barbearia Exemplo LTDA",
  "cnpj": "12.345.678/0001-99",
  "address": "Rua Principal, 123",
  "phone": "(11) 99999-9999",
  "createdAt": "2026-04-03T12:00:00.000Z",
  "updatedAt": "2026-04-03T12:00:00.000Z"
}
```

### PATCH /settings
- Descrição: Atualiza os dados da barbearia (parcial).
- Acesso: `ADMIN`
- Body: qualquer subconjunto dos campos abaixo

```json
{
  "tradeName": "Barbearia Exemplo",
  "legalName": "Barbearia Exemplo LTDA",
  "cnpj": "12.345.678/0001-99",
  "address": "Rua Principal, 123",
  "phone": "(11) 99999-9999"
}
```

Campos (todos opcionais, todos string):
- `tradeName`, `legalName`, `cnpj`, `address`, `phone`

- Resposta `200`: objeto `Settings` atualizado
- Erros comuns:
  - `404` se a linha de settings ainda não existir (rodar `pnpm prisma:seed`)

---

## 7) Users
Prefixo: `/users`

> Equipe da barbearia. Resposta nunca inclui `passwordHash`.

### GET /users
- Descrição: Lista todos os usuários não deletados.
- Acesso: `SUPERVISOR`
- Body: não usa
- Resposta `200`:

```json
[
  {
    "id": 1,
    "name": "João da Silva",
    "email": "joao@barbearia.com",
    "role": "ADMIN",
    "active": true,
    "createdAt": "2026-04-03T12:00:00.000Z",
    "updatedAt": "2026-04-03T12:00:00.000Z"
  }
]
```

### GET /users/:id
- Descrição: Busca usuário por ID.
- Acesso: `SUPERVISOR`
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200`: objeto `User` (mesmo shape acima)

### POST /users
- Descrição: Cria usuário.
- Acesso: `SUPERVISOR`
- Body:

```json
{
  "name": "Novo Barbeiro",
  "email": "barbeiro@barbearia.com",
  "passwordHash": "senha-em-texto-puro",
  "role": "BARBER"
}
```

Campos:
- `name` (string, obrigatório)
- `email` (string, obrigatório, formato de email)
- `passwordHash` (string, obrigatório) — apesar do nome, é a senha em **texto puro**; o back-end faz o hash antes de salvar
- `role` (string, obrigatório) — `ADMIN` | `SUPERVISOR` | `BARBER`

Não existe campo `creatorUserId` no contrato: quem criou o usuário é sempre derivado do `userId` do JWT (interceptor global), nunca de um valor enviado pelo cliente.

Resposta `201/200`: objeto criado (`{ id, name, email, createdAt, updatedAt }`).
Erros comuns:
- `403` se um `SUPERVISOR` tentar cadastrar `role` diferente de `BARBER`.
- `400` se o `userId` do criador não puder ser identificado.

### PATCH /users/:id
- Descrição: Atualiza usuário (parcial).
- Acesso: `SUPERVISOR`
- Parâmetros:
  - `id` (number, obrigatório)
- Body: parcial dos campos de criação (inclusive `passwordHash` para trocar senha)
- Resposta `200`: objeto atualizado
- Erros comuns:
  - `403` se um `SUPERVISOR` tentar editar um `ADMIN`/`SUPERVISOR` ou promover alguém a papel acima de `BARBER`.

### DELETE /users/:id
- Descrição: Exclui usuário (soft delete).
- Acesso: `SUPERVISOR`
- Parâmetros:
  - `id` (number, obrigatório)
- Resposta `200/204`: sem conteúdo
- Regras:
  - Um `SUPERVISOR` só remove `BARBER` — remover `ADMIN`/`SUPERVISOR` retorna `403`.
  - Ninguém pode remover o próprio usuário (`403`).
  - Não é possível remover o último `ADMIN` ativo (`403`).

---

## Resumo rápido para o front

- Prefixos:
  - `/clients`
  - `/services`
  - `/appointments`
  - `/products`
  - `/sales`
  - `/settings`
  - `/users`

- Rotas padrão por módulo:
  - `GET /`
  - `GET /:id`
  - `POST /`
  - `PATCH /:id` (não existe em `sales`)
  - `DELETE /:id`

- Atenções importantes:
  - Não envie `companyId`/`unitId` — esses campos não existem mais na API.
  - `settings` é linha única: só `GET /settings` e `PATCH /settings`, sem `:id`.
  - `sales` não tem `PATCH`.
  - `products` e `sales` usam hard delete; os demais módulos usam soft delete (`deletedAt`).
  - `appointments GET /appointments` filtra por profissional autenticado (`user.id`), com `deletedAt = null` e `status != CANCELLED`.
  - `appointments PATCH /appointments/:id` aceita `BARBER`, mas só no próprio agendamento; nunca aceita campos de cancelamento/cobrança nem `status`.
  - `users` nunca devolve `passwordHash`; `POST/PATCH /users` não aceita `creatorUserId`.
