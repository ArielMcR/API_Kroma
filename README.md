<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Variáveis de ambiente

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/barber_shop"
PORT=3000
JWT_SECRET="..."
SALT_ROUNDS=10

# Sprint 3 — assistente em linguagem natural (Gemini)
GEMINI_API_KEY=...                                 # aceita também GOOGLE_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.1-flash-lite                 # interpreta o comando e redige a resposta
GEMINI_TRANSCRIPTION_MODEL=gemini-3.1-flash-lite   # só transcreve o áudio
GEMINI_TIMEOUT_MS=20000
```

### Por que `flash-lite` nos dois

Não é preferência, é cota. No plano gratuito:

| Modelo | RPM | Requisições/dia |
|---|---|---|
| `gemini-3.5-flash` | 5 | **20** |
| `gemini-3.1-flash-lite` | **15** | **500** |

**20 requisições por dia** dá cerca de 10 comandos de texto (2 chamadas cada) ou 6 de voz
(3 chamadas) — não sustenta nem o desenvolvimento, muito menos uma apresentação. O `flash-lite`
ainda saiu **mais rápido** em tudo o que foi medido, com os mesmos resultados:

| Cenário | `gemini-3.5-flash` | `gemini-3.1-flash-lite` |
|---|---|---|
| Comando de texto | 1,4 – 10 s | **1,5 – 3,2 s** |
| Transcrição de áudio | 7,7 s | **2,2 s** |
| Comando de voz completo | 29,1 s | **9,1 s** |

As duas variáveis existem separadas porque só a interpretação justificaria um modelo maior, caso
um dia haja cota paga — transcrever é tarefa mecânica e não precisa.

**Sobre `GEMINI_MODEL`:** o PRD da Sprint 3 especificava `gemini-2.0-flash`, mas o Google
descontinuou esse modelo (a API devolve `404 NOT_FOUND`) e fechou o `gemini-2.5-flash` para
chaves criadas recentemente. `gemini-3.5-flash` foi validado com function calling. Para
descobrir quais modelos a sua chave aceita:

```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

**Sem a chave a aplicação sobe normalmente** — apenas as rotas `/assistant/*` respondem que o
assistente está indisponível (RNF09). Nenhum outro módulo é afetado.

⚠️ **Contando as chamadas:** um comando de texto consome **duas** (identificar a função + redigir a
resposta) e um de **voz consome três** (transcrever + as duas anteriores). Com os 15 RPM / 500 RPD
do `flash-lite`, isso dá ~7 comandos digitados por minuto e ~160 falados por dia. Ao estourar, a API
responde `429` e o assistente devolve uma mensagem pedindo para aguardar, com os segundos sugeridos.

O painel de uso fica em <https://ai.dev/rate-limit> — vale conferir o **RPD** antes de uma
apresentação, porque o limite diário é o que trava de verdade e não se recupera esperando alguns
segundos.

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

O projeto possui duas suítes de teste independentes — veja [test/RESULTADOS_TESTES.md](test/RESULTADOS_TESTES.md) para o relatório completo de cobertura e resultados.

```bash
# testes unitários (use cases, com mocks de repositório — não acessam banco de dados)
$ pnpm run test:unit

# testes unitários com relatório de cobertura (gerado em coverage/unit)
$ pnpm run test:cov

# testes de integração (sobem a aplicação completa via supertest contra um banco isolado)
$ pnpm run test:integration
```

### Banco de dados de testes de integração

Os testes de integração rodam contra um banco MySQL **isolado** (`barber_shop_test`), separado do banco de desenvolvimento, configurado via `.env.test`. Antes de rodar `test:integration` pela primeira vez:

1. Crie o schema `barber_shop_test` no mesmo servidor MySQL usado em desenvolvimento (mesmas credenciais de `DATABASE_URL`, apenas trocando o nome do banco).
2. Rode `pnpm run pretest:integration` (ou simplesmente `pnpm run test:integration`, que já dispara esse script automaticamente) — ele aplica as migrations do Prisma no banco de teste via `scripts/migrate-test-db.js`.

Cada suíte usa `test/helpers/seed.helper.ts` para popular (`seedTestDatabase`) e limpar (`cleanupTestDatabase`) seus próprios dados (empresa, unidade, usuário admin, serviço e cliente com sufixo único por execução), garantindo isolamento entre os arquivos de spec mesmo quando rodados com `--runInBand`.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
