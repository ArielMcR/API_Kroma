import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/modules/auth/presentation/decorators/current-user.decorator';
import type { User } from 'src/modules/users/domain/user.entity';
import { CommandDto } from '../dto/command.dto';
import { ProcessCommandUseCase } from '../../useCases/process-command.usecase';
import { FindHistoryUseCase } from '../../useCases/find-history.usecase';

/** Comando falado curto. 10 MB cobre com folga um audio de ~1 minuto. */
const LIMITE_AUDIO_BYTES = 10 * 1024 * 1024;

/**
 * Sem @Roles: qualquer usuario autenticado usa o assistente (RN17). O
 * JwtAuthGuard global ja protege a rota.
 */
@Controller('assistant')
export class AssistantController {
  constructor(
    private readonly processCommand: ProcessCommandUseCase,
    private readonly findHistory: FindHistoryUseCase,
  ) {}

  @Post('command')
  async command(@CurrentUser() user: User, @Body() body: CommandDto) {
    return this.processCommand.execute(user.id, body.text);
  }

  /**
   * Comando por voz. Multipart e nao base64 em JSON de proposito: o body parser
   * do Nest limita JSON a 100 kB por padrao, e qualquer audio real estouraria.
   */
  @Post('command/audio')
  @UseInterceptors(
    FileInterceptor('audio', { limits: { fileSize: LIMITE_AUDIO_BYTES } }),
  )
  async commandAudio(
    @CurrentUser() user: User,
    @UploadedFile() audio?: Express.Multer.File,
  ) {
    if (!audio?.buffer?.length) {
      throw new HttpException(
        'Nenhum áudio recebido no campo "audio".',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.processCommand.executeAudio(
      user.id,
      audio.buffer,
      audio.mimetype || 'audio/m4a',
    );
  }

  @Get('history')
  async history(@CurrentUser() user: User, @Query('limit') limit?: string) {
    const teto = limit ? Number(limit) : undefined;
    return this.findHistory.execute(
      user.id,
      Number.isFinite(teto) ? teto : undefined,
    );
  }
}
