# PRD — Sprint 3: Módulo de Interface em Linguagem Natural via MCP
**Sistema de Gerenciamento de Barbearia**

| Campo | Valor |
|---|---|
| Autor | Ariel Machado Rodrigues |
| Sprint | 3 |
| Dependências | Sprints 1 e 2 concluídas |
| Stack Backend | NestJS + TypeScript + Prisma |
| Stack Mobile | React Native + Expo |
| LLM | Google Gemini Flash Lite (`gemini-3.1-flash-lite`) |
| SDK | `@google/genai` |
| Data | 2026 |

> **Nota de revisão (implementação).** Este documento foi escrito antes de o backend remover o
> multi-tenancy, e alguns trechos de código de §4 não refletem mais o sistema. Os desvios
> aplicados na implementação estão consolidados em **§11 — Desvios de implementação**, no final.

---

## 1. Contexto

O módulo de interface em linguagem natural é o diferencial técnico do trabalho. O usuário (funcionário da barbearia) pode digitar ou falar um comando em linguagem natural na tela do aplicativo mobile — como "quais são os agendamentos de amanhã?" ou "cadastra o João Silva, telefone 44999999999" — e o sistema interpreta e executa a operação correspondente sem navegar pelos menus do app.

A integração é feita via **function calling** do Gemini, que permite que o modelo identifique a intenção do usuário e chame uma função estruturada com os parâmetros corretos. O backend expõe um conjunto restrito de 4 funções. O Gemini interpreta o comando, chama a função correspondente e o backend executa usando os mesmos use cases já implementados nas Sprints 1 e 2.

### Decisões já tomadas

| Decisão | Escolha |
|---|---|
| Como o usuário acessa o LLM | Tela de chat no app mobile |
| Histórico de comandos no banco | Sim — tabela `AssistantCommand` |
| Permissão por perfil | Não — qualquer usuário autenticado pode usar |
| Operações destrutivas via LLM | Não expostas (RN20) |
| Funções expostas | 4: consultar agenda, criar agendamento, cadastrar cliente, gerar relatório |
| Modelo | gemini-2.0-flash (free tier) |

---

## 2. Arquitetura

### Fluxo completo de um comando

```
[Usuário digita/fala no app]
        ↓
[Tela de chat (React Native)]
        ↓ POST /assistant/command { text }
[Endpoint no backend NestJS]
        ↓
[ProcessCommandUseCase]
  → Envia texto + function declarations para o Gemini
  → Gemini identifica a função e os parâmetros
  → Use case executa a função chamando os use cases internos
  → Registra o comando em AssistantCommand
  → Gemini gera resposta em linguagem natural com o resultado
        ↓
[Retorna resposta para o app]
        ↓
[App exibe resposta na tela de chat]
```

### Estrutura de arquivos

```
src/modules/assistant/
├── domain/
│   └── assistant.repository.ts
├── infra/
│   └── prisma-assistant.ts
├── presentation/
│   ├── controller/assistant.controller.ts
│   └── dto/
│       └── command.dto.ts
├── useCases/
│   └── process-command.usecase.ts
├── functions/
│   ├── query-schedule.function.ts
│   ├── create-appointment.function.ts
│   ├── register-client.function.ts
│   └── generate-report.function.ts
└── assistant.module.ts
```

---

## 3. Schema Prisma

```prisma
enum CommandStatus {
    SUCCESS
    INTERPRETATION_ERROR
    EXECUTION_ERROR
    UNSUPPORTED_INTENT
}

enum CommandTool {
    QUERY_SCHEDULE
    CREATE_APPOINTMENT
    REGISTER_CLIENT
    GENERATE_REPORT
}

model AssistantCommand {
    id                Int            @id @default(autoincrement())
    userId            Int
    rawText           String         @db.Text
    interpretedIntent String?
    toolExecuted      CommandTool?
    parameters        Json?
    result            String?        @db.Text
    status            CommandStatus
    errorMessage      String?
    durationMs        Int

    user              User           @relation(fields: [userId], references: [id])

    createdAt         DateTime       @default(now())

    @@index([userId, createdAt])
    @@index([status])
}
```

---

## 4. Backend — Detalhamento

### 4.1 Instalação

```bash
npm install @google/generative-ai
```

### 4.2 Variáveis de Ambiente

```env
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash
```

### 4.3 Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/assistant/command` | JWT | Processa comando em linguagem natural |
| GET | `/assistant/history` | JWT | Retorna histórico de comandos do usuário |

**Request:**
```json
{
  "text": "quais são os agendamentos de amanhã?"
}
```

**Response sucesso:**
```json
{
  "response": "Você tem 3 agendamentos amanhã: João às 9h00 (corte), Maria às 10h00 (barba) e Pedro às 14h00 (combo).",
  "toolExecuted": "QUERY_SCHEDULE",
  "status": "SUCCESS",
  "commandId": 42
}
```

**Response falha de interpretação:**
```json
{
  "response": "Não consegui entender o que você quer fazer. Posso consultar agendamentos, criar agendamentos, cadastrar clientes ou gerar relatórios.",
  "status": "INTERPRETATION_ERROR",
  "commandId": 43
}
```

### 4.4 Configuração do Gemini no NestJS

```typescript
// assistant.module.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

@Module({
    providers: [
        {
            provide: 'GEMINI_CLIENT',
            useFactory: () => {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                return genAI.getGenerativeModel({
                    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
                    systemInstruction: `
Você é um assistente de gestão para uma barbearia.
Você pode ajudar com as seguintes operações:
- Consultar agendamentos do dia ou de uma data específica
- Criar um novo agendamento
- Cadastrar um novo cliente
- Gerar relatórios de atendimentos e faturamento

Regras importantes:
- Agendamentos só são permitidos às sextas e sábados
- Horário de funcionamento: 8h às 12h e 13h15 às 19h30
- Não execute operações de exclusão ou alteração de senha
- Responda sempre em português brasileiro
- Se não conseguir identificar a operação, explique o que você pode fazer
                    `.trim(),
                });
            },
        },
        ProcessCommandUseCase,
        PrismaAssistantRepository,
    ],
    exports: ['GEMINI_CLIENT'],
})
export class AssistantModule {}
```

### 4.5 Definição das Functions (Gemini)

```typescript
// src/modules/assistant/functions/function-declarations.ts
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

export const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'QUERY_SCHEDULE',
        description: 'Consulta os agendamentos de um dia específico ou do dia atual. Use quando o usuário perguntar sobre a agenda, atendimentos do dia ou horários marcados.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                date: {
                    type: SchemaType.STRING,
                    description: 'Data no formato YYYY-MM-DD. Se não informada, usa a data atual.',
                },
            },
            required: [],
        },
    },
    {
        name: 'CREATE_APPOINTMENT',
        description: 'Cria um novo agendamento. Use quando o usuário quiser marcar, agendar ou registrar um atendimento para um cliente.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                clientName: {
                    type: SchemaType.STRING,
                    description: 'Nome do cliente a ser agendado.',
                },
                serviceName: {
                    type: SchemaType.STRING,
                    description: 'Nome do serviço: corte, barba, sobrancelha ou combo.',
                },
                date: {
                    type: SchemaType.STRING,
                    description: 'Data do agendamento no formato YYYY-MM-DD.',
                },
                startTime: {
                    type: SchemaType.STRING,
                    description: 'Horário de início no formato HH:MM.',
                },
            },
            required: ['clientName', 'serviceName', 'date', 'startTime'],
        },
    },
    {
        name: 'REGISTER_CLIENT',
        description: 'Cadastra um novo cliente no sistema. Use quando o usuário quiser adicionar ou registrar um novo cliente.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                name: {
                    type: SchemaType.STRING,
                    description: 'Nome completo do cliente.',
                },
                phone: {
                    type: SchemaType.STRING,
                    description: 'Telefone do cliente com DDD.',
                },
            },
            required: ['name', 'phone'],
        },
    },
    {
        name: 'GENERATE_REPORT',
        description: 'Gera um relatório de atendimentos ou faturamento para um período. Use quando o usuário pedir resumo, relatório, quanto faturou ou quantos atendimentos fez.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                type: {
                    type: SchemaType.STRING,
                    description: 'Tipo do relatório: attendance (atendimentos), revenue (faturamento) ou services (serviços mais realizados).',
                },
                from: {
                    type: SchemaType.STRING,
                    description: 'Data inicial no formato YYYY-MM-DD. Se não informada, usa o início do mês atual.',
                },
                to: {
                    type: SchemaType.STRING,
                    description: 'Data final no formato YYYY-MM-DD. Se não informada, usa a data atual.',
                },
            },
            required: ['type'],
        },
    },
];
```

### 4.6 ProcessCommandUseCase

```typescript
// process-command.usecase.ts
import { Inject, Injectable } from '@nestjs/common';
import { GenerativeModel } from '@google/generative-ai';
import { functionDeclarations } from '../functions/function-declarations';

@Injectable()
export class ProcessCommandUseCase {
    constructor(
        @Inject('GEMINI_CLIENT')
        private readonly model: GenerativeModel,
        @Inject('AssistantRepository')
        private readonly assistantRepository: AssistantRepository,
        private readonly findAllAppointments: FindAllAppointmentsUseCase,
        private readonly createAppointment: CreateAppointmentUseCase,
        private readonly createClient: CreateClientUseCase,
        private readonly attendanceReport: AttendanceReportUseCase,
        private readonly clientRepository: ClientRepository,
        private readonly serviceRepository: ServiceRepository,
    ) {}

    async execute(userId: number, companyId: number, unitId: number, rawText: string) {
        const startTime = Date.now();

        try {
            // Inicia chat com as function declarations disponíveis
            const chat = this.model.startChat({
                tools: [{ functionDeclarations }],
            });

            // Envia o comando do usuário
            const result = await chat.sendMessage(rawText);
            const response = result.response;

            // Verifica se o Gemini quer chamar uma função
            const functionCall = response.functionCalls()?.[0];

            if (!functionCall) {
                // Gemini respondeu em texto — comando não mapeado
                const textResponse = response.text();
                return this.saveAndReturn({
                    userId, rawText,
                    status: 'UNSUPPORTED_INTENT',
                    result: textResponse,
                    durationMs: Date.now() - startTime,
                });
            }

            // Executa a função identificada
            const functionResult = await this.executeFunction(
                functionCall.name,
                functionCall.args,
                userId, companyId, unitId,
            );

            // Envia o resultado de volta ao Gemini para gerar resposta em linguagem natural
            const finalResult = await chat.sendMessage([{
                functionResponse: {
                    name: functionCall.name,
                    response: { result: functionResult },
                },
            }]);

            const naturalResponse = finalResult.response.text();

            return this.saveAndReturn({
                userId, rawText,
                toolExecuted: functionCall.name as any,
                parameters: functionCall.args,
                status: 'SUCCESS',
                result: naturalResponse,
                durationMs: Date.now() - startTime,
            });

        } catch (error) {
            return this.saveAndReturn({
                userId, rawText,
                status: 'EXECUTION_ERROR',
                errorMessage: error.message,
                result: 'Ocorreu um erro ao processar o comando. Tente novamente.',
                durationMs: Date.now() - startTime,
            });
        }
    }

    private async executeFunction(
        name: string,
        args: Record<string, any>,
        userId: number,
        companyId: number,
        unitId: number,
    ): Promise<any> {
        switch (name) {
            case 'QUERY_SCHEDULE': {
                const date = args.date ? new Date(args.date) : new Date();
                return this.findAllAppointments.execute(userId);
            }

            case 'CREATE_APPOINTMENT': {
                const client = await this.clientRepository.findByName(args.clientName, companyId);
                const service = await this.serviceRepository.findByName(args.serviceName, companyId);

                if (!client) {
                    throw new Error(`Cliente "${args.clientName}" não encontrado. Cadastre-o primeiro.`);
                }
                if (!service) {
                    throw new Error(`Serviço "${args.serviceName}" não encontrado.`);
                }

                return this.createAppointment.execute({
                    userId,
                    clientId: client.id,
                    serviceId: service.id,
                    appointmentDate: new Date(args.date),
                    startTime: args.startTime,
                    companyId,
                    unitId,
                });
            }

            case 'REGISTER_CLIENT': {
                return this.createClient.execute({
                    name: args.name,
                    phone: args.phone,
                    companyId,
                    unitId,
                });
            }

            case 'GENERATE_REPORT': {
                const from = args.from
                    ? new Date(args.from)
                    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                const to = args.to ? new Date(args.to) : new Date();

                return this.attendanceReport.execute({
                    type: args.type,
                    from,
                    to,
                    companyId,
                    unitId,
                });
            }

            default:
                throw new Error(`Função desconhecida: ${name}`);
        }
    }

    private async saveAndReturn(data: {
        userId: number;
        rawText: string;
        toolExecuted?: any;
        parameters?: any;
        status: string;
        result: string;
        errorMessage?: string;
        durationMs: number;
    }) {
        const saved = await this.assistantRepository.saveCommand(data);
        return {
            response: data.result,
            toolExecuted: data.toolExecuted ?? null,
            status: data.status,
            commandId: saved.id,
        };
    }
}
```

---

## 5. Mobile — Tela de Chat

### 5.1 Estrutura

```
app/(drawer)/(tabs)/assistente.tsx
```

### 5.2 Redux

```typescript
// types/assistant.ts
export type Message = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    status?: 'SUCCESS' | 'INTERPRETATION_ERROR' | 'EXECUTION_ERROR' | 'UNSUPPORTED_INTENT';
    timestamp: Date;
};

// actions/assistantActions.ts
export const SEND_COMMAND_REQUEST = 'SEND_COMMAND_REQUEST';
export const SEND_COMMAND_SUCCESS = 'SEND_COMMAND_SUCCESS';
export const SEND_COMMAND_FAILURE = 'SEND_COMMAND_FAILURE';
export const CLEAR_CHAT = 'CLEAR_CHAT';

// reducers/assistantReducer.ts
const initialState = {
    messages: [] as Message[],
    loading: false,
    error: null as string | null,
};
```

### 5.3 Saga

```typescript
// sagas/sagasAssistant.ts
function* sendCommandSaga(action: any) {
    try {
        const response: AxiosResponse = yield call(
            api.post,
            '/assistant/command',
            { text: action.payload.text },
        );

        yield put({
            type: SEND_COMMAND_SUCCESS,
            payload: {
                userMessage: action.payload.text,
                assistantMessage: response.data.response,
                status: response.data.status,
            },
        });
    } catch (error: any) {
        yield put({
            type: SEND_COMMAND_FAILURE,
            payload: 'Não foi possível processar o comando. Verifique sua conexão.',
        });
    }
}
```

### 5.4 Tela (estrutura básica)

```tsx
// assistente.tsx
export default function AssistentePage() {
    const dispatch = useDispatch();
    const { messages, loading } = useSelector((state) => state.assistant);
    const [inputText, setInputText] = useState('');

    const handleSend = () => {
        if (!inputText.trim()) return;
        dispatch({ type: SEND_COMMAND_REQUEST, payload: { text: inputText } });
        setInputText('');
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Lista de mensagens */}
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <MessageBubble
                        role={item.role}
                        text={item.text}
                        status={item.status}
                    />
                )}
                inverted
            />

            {/* Loading */}
            {loading && <ActivityIndicator />}

            {/* Input */}
            <View style={{ flexDirection: 'row', padding: 8 }}>
                <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Digite um comando..."
                    style={{ flex: 1 }}
                />
                <TouchableOpacity onPress={handleSend}>
                    <Text>Enviar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
```

---

## 6. Regras de Negócio

| RN | Descrição | Como implementar |
|---|---|---|
| RN17 | Disponível para qualquer usuário autenticado | JwtAuthGuard no controller — sem verificação de role |
| RN18 | Validações de negócio respeitadas mesmo via LLM | Functions chamam os mesmos use cases com as mesmas validações |
| RN19 | Comandos inválidos registrados sem alterar estado | Bloco catch salva com status EXECUTION_ERROR |
| RN20 | Operações destrutivas não expostas | Nenhuma function de delete, cancel forçado ou alteração de senha |

---

## 7. Métricas de Avaliação

```sql
-- Taxa de acerto por status
SELECT
    status,
    COUNT(*) as total,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentual
FROM AssistantCommand
WHERE createdAt BETWEEN '2026-xx-xx' AND '2026-xx-xx'
GROUP BY status;

-- Tempo médio de resposta
SELECT
    AVG(durationMs) as media_ms,
    MAX(durationMs) as maximo_ms,
    MIN(durationMs) as minimo_ms
FROM AssistantCommand
WHERE status = 'SUCCESS';

-- Comandos por função executada
SELECT toolExecuted, COUNT(*) as total
FROM AssistantCommand
WHERE status = 'SUCCESS'
GROUP BY toolExecuted;
```

---

## 8. Critérios de Aceitação

| # | Critério | Prioridade |
|---|---|---|
| 1 | "quais são os agendamentos de hoje?" retorna lista correta | Alta |
| 2 | "agenda o João para sexta às 9h para corte" cria agendamento com validações | Alta |
| 3 | Agendamento em dia inválido retorna erro em linguagem natural | Alta |
| 4 | "cadastra cliente Maria, telefone 44988887777" cria cliente | Alta |
| 5 | "quanto faturei esse mês?" retorna relatório de faturamento | Alta |
| 6 | Comando sem sentido retorna resposta amigável | Alta |
| 7 | Todos os comandos registrados em AssistantCommand | Alta |
| 8 | Nenhuma operação de exclusão exposta via LLM (RN20) | Alta |
| 9 | Falhas no Gemini não derrubam o restante do sistema (RNF09) | Alta |
| 10 | Resposta em até 10 segundos em condições normais (RNF08) | Média |

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Gemini não identificar a função correta | Alto | Descriptions precisas nas function declarations; testar com exemplos reais |
| Parâmetros ausentes na chamada da função | Médio | Validar antes de executar; retornar erro em linguagem natural |
| Latência do Gemini > 10s | Médio | Loading visível no app; timeout configurável |
| Limite do free tier atingido | Baixo | 1500 req/dia é muito mais que suficiente para o TCC |
| Falha na API do Gemini derruba o app | Alto | Try/catch isolado no use case; RNF09 exige que o restante funcione normalmente |

---

## 10. Definição de Pronto (DoD)

- [x] Migration aplicada (tabela `AssistantCommand`) — `20260815171311_add_assistant_command`
- [x] Endpoint `POST /assistant/command` funcional
- [x] Endpoint `GET /assistant/history` funcional
- [x] 4 functions implementadas e testadas manualmente
- [x] System instruction definida e validada
- [x] Tela de chat no mobile funcional
- [x] Redux integrado (saga + reducer + actions)
- [x] Todos os comandos registrados no banco
- [x] Falhas isoladas — sistema continua funcionando sem o Gemini
- [x] `GEMINI_API_KEY` e `GEMINI_MODEL` documentados no README

---

## 11. Desvios de implementação

O PRD foi escrito contra a versão multi-tenant do backend. O sistema atual é de **instalação
única** e várias assinaturas mudaram. Abaixo o que foi implementado no lugar do que está em §4.6.

### 11.1 Multi-tenancy removida

`companyId` e `unitId` **não existem** no sistema. Foram removidos de `execute()`,
`executeFunction()` e de todas as chamadas a use cases.

### 11.2 Assinaturas reais

| §4.6 dizia | Implementado |
|---|---|
| `clientRepository.findByName(nome, companyId)` | Método **criado** em `ClientRepository` — `findByName(nome)`, casando nome + sobrenome antes de cair no primeiro nome |
| `serviceRepository.findByName(nome, companyId)` | Método **criado** em `ServicesRepository` |
| `createClient.execute({ name, phone })` | `{ name, lastName, cellPhone }` — o `Client` guarda nome e sobrenome separados; o nome completo do LLM é dividido |
| `createAppointment.execute({ userId, ... })` | `{ clientId, serviceId, professionalId, appointmentDate, startTime, endTime, status }`. `professionalId` = usuário autenticado; `endTime` é recalculado pelo use case a partir da duração do serviço |
| `attendanceReport.execute({ type, from, to })` | Não existe dispatch por `type`. `GENERATE_REPORT` roteia para `AttendanceReportUseCase`, `RevenueReportUseCase` ou `ServicesReportUseCase` |

### 11.3 QUERY_SCHEDULE consultava a data errada

O código de §4.6 calculava `const date` e **nunca o usava**, chamando
`findAllAppointments.execute(userId)` — todos os agendamentos do usuário logado, sem filtro de
data. Isso responde errado a "agendamentos de amanhã" e falha o critério 1.

Implementado: `AppointmentRepository.getByDate(date)` + `FindAppointmentsByDateUseCase`,
retornando os agendamentos **da barbearia inteira** na data (intervalo do dia local, para não
depender de igualdade exata em `DateTime`).

### 11.4 Erro de negócio volta ao modelo

Em §4.6, uma exceção do use case caía no `catch` externo e devolvia
`"Ocorreu um erro ao processar o comando"` — o que **reprova o critério 3**, que exige erro em
linguagem natural.

Implementado: a falha de regra de negócio é capturada em volta de `executarFuncao`, devolvida ao
Gemini como `functionResponse` e transformada em frase. O comando fica gravado como
`EXECUTION_ERROR` **com `toolExecuted` preenchido** — o que distingue "a regra barrou" de "a
infraestrutura caiu". O `catch` externo passa a tratar apenas falha de infra.

### 11.5 Data corrente na system instruction

O modelo não sabe que dia é hoje, então não resolvia "amanhã" nem "esse mês". A instrução passou a
ser montada por requisição, com a data atual e o dia da semana injetados. Também foi acrescentada a
regra real de antecedência máxima de 7 dias, que existe no `AppointmentScheduleValidator` e não
constava na instrução original.

### 11.6 SDK e modelo

`@google/generative-ai` está descontinuado; a implementação usa **`@google/genai`**. Diferenças que
afetam o código de §4.6:

- `ai.chats.create({ model, config })` no lugar de `getGenerativeModel(...).startChat(...)`
- `response.functionCalls` e `response.text` são **getters**, não métodos (`response.text()` quebra)
- `Type.OBJECT` / `Type.STRING` no lugar de `SchemaType.*`

`gemini-2.0-flash` foi descontinuado (404) e `gemini-2.5-flash` está fechado para chaves novas.
Modelo em uso: **`gemini-3.1-flash-lite`** — a escolha é explicada em §11.7 (cota diária).

`thinkingConfig: { thinkingBudget: 0 }` foi necessário: os modelos flash 2.5+ "pensam" por padrão e
um comando fora de escopo chegou a estourar 20 s. Com o orçamento zerado e o flash-lite, os tempos
medidos ficaram bem dentro do RNF08:

| Cenário | `gemini-3.5-flash` | `gemini-3.1-flash-lite` |
|---|---|---|
| Comando de texto (2 chamadas) | 1,4 – 10 s | **1,5 – 3,2 s** |
| Transcrição de áudio | 7,7 s | **2,2 s** |
| Comando de voz completo (3 chamadas) | 29,1 s | **9,1 s** |

Também foi medida a alternativa de mandar o áudio direto com as *tools* numa chamada só: **15,8 s**
no `gemini-3.5-flash`, ou seja, pior que transcrever separado — e ainda perderia a transcrição.
Por isso o fluxo de voz transcreve primeiro (§11.9).

### 11.9 Entrada por voz (fora do escopo original do PRD)

Acrescentado `POST /assistant/command/audio` (multipart, campo `audio`), que devolve o mesmo
contrato de `/command` mais o campo `transcription`. É apenas um adaptador: transcreve e chama o
**mesmo** `execute` do texto, então RN18/RN19/RN20 e o registro em `AssistantCommand` valem
identicamente. A transcrição é gravada em `rawText`, mantendo as métricas de §7 analisáveis.

Multipart em vez de base64 em JSON porque o body parser do Nest limita JSON a 100 kB.

No app, a tela do assistente ganhou botão de segurar-para-falar (`expo-audio`), que continua
rodando em **Expo Go** — reconhecimento de voz nativo no aparelho exigiria *development build*.

### 11.7 Correção na tabela de riscos (§9)

> ~~Limite do free tier atingido — Impacto **Baixo** — 1500 req/dia é muito mais que suficiente~~

Os 1500 req/dia não existem no plano gratuito atual, e **o limite diário foi estourado durante o
desenvolvimento**. Impacto real: **Alto** — é o fator que determina qual modelo dá para usar.

| Modelo | RPM | Requisições/dia |
|---|---|---|
| `gemini-3.5-flash` | 5 | **20** |
| `gemini-3.1-flash-lite` | 15 | 500 |

Um comando de texto gasta 2 chamadas e um de voz gasta 3. Com o `gemini-3.5-flash` isso significa
**~10 comandos digitados por dia** — insuficiente até para desenvolver. Por isso o modelo adotado é
o `gemini-3.1-flash-lite`, que além da cota 25× maior saiu mais rápido em todos os cenários medidos
(ver §11.6) sem perder nenhum critério de aceitação.

Mitigações implementadas: o `429` vira mensagem em linguagem natural com os segundos sugeridos pela
própria API, e o modelo é configurável por `.env` sem alterar código. Antes de uma apresentação,
conferir o **RPD** em <https://ai.dev/rate-limit> — o limite diário não se recupera esperando.

### 11.8 Status `INTERPRETATION_ERROR`

Em §4.6 esse status nunca era emitido, embora apareça no exemplo de resposta de §4.3. Passou a ser
usado quando o modelo chama uma função **fora** das quatro declaradas.
