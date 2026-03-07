import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { roleHierarchy } from "../../domain/roles-hierarchy";
import { CURRENT_ROLES } from "../../presentation/decorators/roles-user.decorator";
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(CURRENT_ROLES, [context.getHandler(), context.getClass()]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        return roleHierarchy[user.role] >=
            Math.min(...requiredRoles.map(r => roleHierarchy[r]));
    }
}