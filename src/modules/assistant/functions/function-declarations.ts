import { type FunctionDeclaration, Type } from '@google/genai';

/**
 * Superficie exposta ao LLM. Sao as UNICAS quatro operacoes que o assistente
 * consegue disparar — nao existe function de exclusao, cancelamento forcado ou
 * troca de senha, e e assim que a RN20 e cumprida: por ausencia, nao por
 * verificacao em tempo de execucao.
 */
export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'QUERY_SCHEDULE',
    description:
      'Consulta os agendamentos da barbearia em um dia específico ou no dia atual. Use quando o usuário perguntar sobre a agenda, atendimentos do dia ou horários marcados.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description:
            'Data no formato YYYY-MM-DD. Se não informada, usa a data atual.',
        },
      },
      required: [],
    },
  },
  {
    name: 'CREATE_APPOINTMENT',
    description:
      'Cria um novo agendamento. Use quando o usuário quiser marcar, agendar ou registrar um atendimento para um cliente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: {
          type: Type.STRING,
          description: 'Nome do cliente a ser agendado.',
        },
        serviceNames: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'Lista dos serviços do atendimento, como ["corte", "barba"]. Um atendimento pode ter vários serviços e a duração é a soma deles. Se o usuário citar apenas um, envie uma lista com um item.',
        },
        date: {
          type: Type.STRING,
          description: 'Data do agendamento no formato YYYY-MM-DD.',
        },
        startTime: {
          type: Type.STRING,
          description: 'Horário de início no formato HH:MM.',
        },
      },
      required: ['clientName', 'serviceNames', 'date', 'startTime'],
    },
  },
  {
    name: 'REGISTER_CLIENT',
    description:
      'Cadastra um novo cliente no sistema. Use quando o usuário quiser adicionar ou registrar um novo cliente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Nome completo do cliente.',
        },
        phone: {
          type: Type.STRING,
          description: 'Telefone do cliente com DDD.',
        },
      },
      required: ['name', 'phone'],
    },
  },
  {
    name: 'GENERATE_REPORT',
    description:
      'Gera um relatório de atendimentos, faturamento ou serviços mais realizados para um período. Use quando o usuário pedir resumo, relatório, quanto faturou ou quantos atendimentos fez.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description:
            'Tipo do relatório: attendance (atendimentos), revenue (faturamento) ou services (serviços mais realizados).',
        },
        from: {
          type: Type.STRING,
          description:
            'Data inicial no formato YYYY-MM-DD. Se não informada, usa o início do mês atual.',
        },
        to: {
          type: Type.STRING,
          description:
            'Data final no formato YYYY-MM-DD. Se não informada, usa a data atual.',
        },
      },
      required: ['type'],
    },
  },
];
