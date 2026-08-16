import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(private readonly prismaService: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const operation = `${request.method} ${request.route?.path ?? request.url}`;
    const userId: number | undefined = request.user?.id;

    return next.handle().pipe(
      tap({
        next: () => {
          void this.log(operation, userId, Date.now() - startTime, true);
        },
        error: (err) => {
          const errorMessage = err instanceof Error ? err.message : String(err);
          void this.log(
            operation,
            userId,
            Date.now() - startTime,
            false,
            errorMessage,
          );
        },
      }),
    );
  }

  private async log(
    operation: string,
    userId: number | undefined,
    duration: number,
    success: boolean,
    errorMessage?: string,
  ) {
    try {
      await this.prismaService.operationLog.create({
        data: { operation, userId, duration, success, errorMessage },
      });
    } catch {
      // Falha ao registrar log nao deve impactar a requisicao original
    }
  }
}
