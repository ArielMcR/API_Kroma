# Resultados dos Testes Automatizados — Sprint 4 (S4.4)

Relatório gerado para alimentar o capítulo de Resultados da monografia (TCC), referente à
implementação da infraestrutura de testes (S4.1), testes unitários (S4.2) e testes de
integração (S4.3) do back-end do sistema Barber Shop.

## Como reproduzir este relatório

```bash
# testes unitários + cobertura (gera coverage/unit/lcov-report/index.html)
pnpm run test:cov

# testes de integração (sobe o banco isolado barber_shop_test e roda contra a API completa)
pnpm run test:integration
```

## 1. Resumo Geral

| Métrica | Resultado |
|---|---|
| Testes unitários | **30 testes** (8 casos de uso cobertos) |
| Testes de integração | **19 testes** (13 rotas REST cobertas em 6 módulos) |
| Cobertura de código (linhas) | **30,1%** |
| Cobertura de código (branches) | **46,22%** |
| Cobertura de código (statements) | 26,76% |
| Cobertura de código (funções) | 18,75% |
| Tempo de execução — unitários | ≈ 2,5 s |
| Tempo de execução — integração | ≈ 7,3 s |
| Tempo de execução total | ≈ 9,8 s |
| Aprovados | **49 / 49** |
| Reprovados | 0 / 49 |
| Pendentes | 0 / 49 |

> A cobertura de 30,1% (linhas) é calculada sobre **todos** os arquivos de `useCases/` e
> `domain/` do projeto (`collectCoverageFrom`), incluindo módulos stub sem testes
> (`company`, `units`, `products`, `sales`, parte de `users`/`services`). Restrita aos
> módulos efetivamente exercitados pela Sprint 1/2 (appointments, clients, observations,
> auth/validate-user, reports), a cobertura de linhas ultrapassa 80% nos arquivos testados.

## 2. Testes Unitários (S4.2)

8 suítes / 30 testes — 100% aprovados — tempo total ≈ 7,0 s

| Suíte | Caso de uso | Testes |
|---|---|---|
| `create-appointment.usecase.spec.ts` | `CreateAppointmentUseCase` | 7 |
| `cancel-appointment.usecase.spec.ts` | `CancelAppointmentUseCase` | 3 |
| `update-appointment.usecase.spec.ts` | `UpdateAppointmentUseCase` | 3 |
| `create-client.usecase.spec.ts` | `CreateClientUseCase` | 3 |
| `create-observation.usecase.spec.ts` | `CreateObservationUseCase` | 5 |
| `validate-user.usecase.spec.ts` | `ValidateUserUseCase` | 5 |
| `attendance-report.usecase.spec.ts` | `AttendanceReportUseCase` | 2 |
| `revenue-report.usecase.spec.ts` | `RevenueReportUseCase` | 2 |
| **Total** | **8 casos de uso** | **30** |

Tempo de execução medido: ≈ 2,5 s.

Cobertura nos arquivos exercitados (statements / lines):

| Arquivo | % Statements | % Branch | % Lines |
|---|---|---|---|
| `create-appointment.usecase.ts` | 96% | 83,33% | 95,65% |
| `cancel-appointment.usecase.ts` | 100% | 83,33% | 100% |
| `update-appointment.usecase.ts` | 100% | 75% | 100% |
| `create-client.usecase.ts` | 100% | 100% | 100% |
| `create-observation.usecase.ts` | 100% | 100% | 100% |
| `validate-user.usecase.ts` | 100% | 87,5% | 100% |
| `attendance-report.usecase.ts` | 100% | 100% | 100% |
| `revenue-report.usecase.ts` | 100% | 100% | 100% |

## 3. Testes de Integração (S4.3)

6 suítes / 19 testes — 100% aprovados — banco isolado `barber_shop_test` — tempo total ≈ 7,3 s

| Suíte | Rotas exercitadas | Testes |
|---|---|---|
| `auth.e2e-spec.ts` | `POST /auth/login`, `PATCH /auth/change-password` | 4 |
| `clients.e2e-spec.ts` | `POST /clients`, `GET /clients`, `GET /clients/:id`, `PATCH /clients/:id`, `DELETE /clients/:id` | 5 |
| `appointments.e2e-spec.ts` | `POST /appointments`, `GET /appointments`, `POST /appointments/:id/cancel` | 5 |
| `observations.e2e-spec.ts` | `POST /observations`, `GET /observations/client/:id` | 2 |
| `reports.e2e-spec.ts` | `GET /reports/attendance`, `GET /reports/revenue` | 2 |
| `app.e2e-spec.ts` | `GET /` (verifica proteção do `JwtAuthGuard` global) | 1 |
| **Total** | **13 rotas** | **19** |

### Cenários relevantes cobertos

- Login com credenciais válidas/inválidas, troca de senha e bloqueio após 6 tentativas (RF20 → HTTP 429)
- CRUD de clientes, incluindo soft delete (`deletedAt`) e atualização parcial
- Criação de agendamento válido, conflito de horário (409), dia não permitido (400, RN01) e cancelamento com liberação de horário
- Criação e listagem de observações vinculadas a um cliente
- Relatórios de atendimento e faturamento (incluindo cobrança por cancelamento tardio)
- Proteção global de rotas pelo `JwtAuthGuard` (rota raiz exige autenticação)

## 4. Bugs identificados e corrigidos durante a escrita dos testes

A escrita dos testes de integração expôs três defeitos reais na aplicação (não apenas
problemas nos testes), corrigidos como parte da Sprint 4:

1. **`PATCH /clients/:id` retornava 500** — o `InjectUserBodyInterceptor` injeta
   `companyId`/`unitId`/`userId` no corpo da requisição, e `updateClient` repassava esses
   campos diretamente para `prisma.client.update()`, que rejeita `companyId`/`unitId` como
   argumentos diretos de atualização. Corrigido removendo os campos de escopo antes do update
   (e impedindo, como efeito colateral positivo, a reatribuição de tenant via PATCH).
2. **`POST /observations` retornava 500** — mesma causa raiz: `companyId`/`unitId`/`userId`
   injetados eram repassados ao `prisma.observation.create()`/`update()`, mas o modelo
   `Observation` não possui essas colunas. Corrigido filtrando explicitamente os campos
   válidos (`clientId`, `content`, `type`) antes de chamar o Prisma.
3. **Agendamentos em sextas/sábados eram rejeitados com "Agendamentos só são permitidos às
   sextas e sábados"** — `new Date("YYYY-MM-DD")` é interpretado como UTC, mas
   `Date.getDay()` usa o fuso horário local; em `America/Sao_Paulo` (UTC-3) uma data de
   sexta-feira recuada para quinta-feira, derrubando a validação RN01. Corrigido com
   `AppointmentScheduleValidator.parseAppointmentDate()`, que monta a data a partir dos
   componentes ano/mês/dia em horário local.

## 5. Tabela-resumo (formato TCC)

| Item | Quantidade | Status |
|---|---|---|
| Testes unitários | 30 | ✅ 30 aprovados / 0 reprovados |
| Casos de uso cobertos (unitário) | 8 | — |
| Testes de integração | 19 | ✅ 19 aprovados / 0 reprovados |
| Rotas REST cobertas (integração) | 13 | — |
| Total de testes automatizados | 49 | ✅ 49 aprovados (100%) |
| Cobertura de linhas | 30,1% (geral) / >80% (módulos exercitados) | — |
| Cobertura de branches | 46,22% | — |
| Tempo total de execução | ≈ 9,8 s (2,5 s unit + 7,3 s integration) | — |
| Bugs de produção identificados e corrigidos via testes | 3 | ✅ corrigidos |

## 6. Como executar e gerar este relatório novamente

Ver seção "Run tests" do [README.md](../README.md) do back-end para instruções completas
de configuração do banco de testes isolado e dos comandos `test:unit`, `test:cov` e
`test:integration`. O relatório de cobertura HTML é gerado em `coverage/unit/lcov-report/index.html`
após `pnpm run test:cov`.
