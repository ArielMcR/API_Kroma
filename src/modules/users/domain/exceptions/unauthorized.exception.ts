// Exceção de domínio - independente de HTTP
export class UnauthorizedUserCreationException extends Error {
    constructor(message: string = 'Usuário não tem permissão para criar outros usuários') {
        super(message);
        this.name = 'UnauthorizedUserCreationException';
    }
}
