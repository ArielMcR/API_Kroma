import { Injectable, Logger } from '@nestjs/common';
import { type Chat, GoogleGenAI } from '@google/genai';
import { functionDeclarations } from '../functions/function-declarations';
import { montarSystemInstruction } from '../domain/system-instruction';

/** Erro de infraestrutura do assistente — distingue "Gemini fora" de "regra de negocio barrou". */
export class AssistantUnavailableError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'AssistantUnavailableError';
  }
}

const TIMEOUT_PADRAO_MS = 20_000;

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly ai: GoogleGenAI | null;
  private readonly model: string;
  private readonly transcriptionModel: string;
  private readonly timeoutMs: number;

  constructor() {
    // O PRD especifica GEMINI_API_KEY, mas o .env do projeto ja usava
    // GOOGLE_GEMINI_API_KEY. Aceita os dois para nao quebrar nenhum dos lados.
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    // O PRD fixa gemini-2.0-flash, mas o Google o descontinuou (404) e fechou
    // ate o 2.5-flash para chaves novas ("no longer available to new users").
    // gemini-3.5-flash foi validado com function calling contra a chave atual.
    // flash-lite como padrao por causa da cota, nao por preferencia: no plano
    // gratuito o gemini-3.5-flash da 5 RPM e apenas **20 requisicoes por dia**
    // — cerca de 10 comandos de texto ou 6 de voz, o que nao sustenta nem o
    // desenvolvimento. O flash-lite da 15 RPM e 500 RPD, transcreve 3,5x mais
    // rapido e faz function calling igual.
    this.model = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
    // Modelo separado para transcrever: continua fazendo sentido manter os dois
    // configuraveis, porque so a interpretacao justifica trocar por um modelo
    // maior se um dia houver cota paga.
    this.transcriptionModel =
      process.env.GEMINI_TRANSCRIPTION_MODEL ?? 'gemini-3.1-flash-lite';
    this.timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || TIMEOUT_PADRAO_MS;

    // Ausencia de chave nao derruba o boot: o restante da API precisa subir
    // normalmente mesmo sem o assistente (RNF09 / criterio de aceitacao 9).
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY ausente — o assistente responderá indisponível, o resto da API segue normal.',
      );
      this.ai = null;
      return;
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  get disponivel(): boolean {
    return this.ai !== null;
  }

  criarChat(agora: Date): Chat {
    if (!this.ai) {
      throw new AssistantUnavailableError(
        'Assistente não configurado: defina GEMINI_API_KEY no .env.',
      );
    }

    return this.ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: montarSystemInstruction(agora),
        tools: [{ functionDeclarations }],
        // Os modelos flash 2.5+ "pensam" por padrao, e isso sozinho levou um
        // comando fora de escopo a estourar 20s. Roteamento para 4 funcoes nao
        // precisa de raciocinio extenso, e o PRD pede resposta em ate 10s
        // (RNF08) — orcamento zero derruba a latencia para ~1-3s.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
  }

  /**
   * Transcreve um comando falado. O Gemini e multimodal e conseguiria ir direto
   * do audio para a function call numa unica chamada — mas entao a transcricao
   * nunca existiria, e ela e necessaria em dois lugares: para o chat mostrar o
   * que foi ouvido (o usuario precisa notar se entendeu errado) e para o campo
   * `rawText` do AssistantCommand, que alimenta as metricas de avaliacao.
   * O custo e uma chamada a mais por comando de voz.
   */
  async transcrever(audio: Buffer, mimeType: string): Promise<string> {
    if (!this.ai) {
      throw new AssistantUnavailableError(
        'Assistente não configurado: defina GEMINI_API_KEY no .env.',
      );
    }

    const resposta = await this.comTimeout(
      this.ai.models.generateContent({
        model: this.transcriptionModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Transcreva literalmente o comando falado neste áudio, em português do Brasil. Responda apenas com a transcrição, sem aspas, sem comentários e sem explicações. Se não houver fala compreensível, responda exatamente: VAZIO',
              },
              { inlineData: { mimeType, data: audio.toString('base64') } },
            ],
          },
        ],
        config: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    );

    const texto = resposta.text?.trim() ?? '';

    // Comparar com igualdade exata nao basta: gravacoes de silencio no celular
    // fizeram o modelo devolver "VAZIO00:00" (o sentinel colado a ruido), que
    // passou adiante como se fosse comando. Normaliza e testa o prefixo.
    const normalizado = texto.replace(/[\s"'.]/g, '').toUpperCase();
    if (!texto || normalizado.startsWith('VAZIO')) return '';

    return texto;
  }

  /**
   * O SDK nao impoe teto de tempo. Sem isso um Gemini lento prende o request do
   * app indefinidamente — o PRD pede resposta em ate 10s (RNF08) e timeout
   * configuravel na tabela de riscos.
   */
  async comTimeout<T>(promessa: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    const limite = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new AssistantUnavailableError(
              `O assistente demorou mais de ${Math.round(this.timeoutMs / 1000)}s para responder.`,
            ),
          ),
        this.timeoutMs,
      );
    });

    try {
      return await Promise.race([promessa, limite]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
