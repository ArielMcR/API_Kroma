import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";

@Injectable()
export class InjectUserBodyInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const request = context.switchToHttp().getRequest();
        if (!request.user) {
            return next.handle();
        }
        request.body = { ...request.body, companyId: request.user.companyId, userId: request.user.id, unitId: request.user.unitId };
        return next.handle();
    }
}