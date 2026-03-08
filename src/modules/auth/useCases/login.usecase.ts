import { HttpException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { User } from "src/modules/users/domain/user.entity";

@Injectable()
export class LoginUseCase {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async execute(user: User, companyId?: number, unitId?: number) {
        const isSuperAdmin = user.role === 'SUPER_ADMIN';

        // SUPER_ADMIN sem contexto: devolve lista de empresas + token sem company/unit
        if (isSuperAdmin && !companyId && !unitId) {
            const companies = await this.prisma.company.findMany({
                where: { active: true },
                include: { units: { where: { deletedAt: null } } },
            });
            const access_token = this.jwtService.sign(this.buildPayload(user));
            return {
                access_token,
                companies,
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
            };
        }
        const targetCompanyId = companyId ?? user.companyId;
        const targetUnitId = unitId ?? user.unitId;

        if (!targetCompanyId || !targetUnitId) {
            throw new HttpException('Company e Unit sao obrigatorios para este usuario', 400);
        }

        const company = await this.prisma.company.findUnique({
            where: { id: targetCompanyId },
            include: { units: { where: { id: targetUnitId, deletedAt: null } } },
        });


        if (!company || !company.units || company.units.length === 0) {
            throw new HttpException('Empresa ou unidade nao encontrada', 404);
        }

        const access_token = this.jwtService.sign(
            this.buildPayload(user, targetCompanyId, targetUnitId),
        );
        return { access_token, company, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }

    private buildPayload(user: User, companyId?: number, unitId?: number) {
        return {
            sub: user.id,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: companyId ?? null,
            unitId: unitId ?? null,
        };
    }
}