import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "src/modules/auth/presentation/decorators/public.decorator";

@Injectable()
export class InjectUserBodyInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return next.handle();

        const request = context.switchToHttp().getRequest();
        if (!request.user) return next.handle();

        request.body = { ...request.body, companyId: request.user.companyId, userId: request.user.id, unitId: request.user.unitId };
        return next.handle();
    }
}