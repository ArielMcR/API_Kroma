/**
 * Remove tudo que não é dígito do celular. O mesmo cliente pode chegar
 * mascarado pelo app ("(11) 98888-7777"), cru pelo seed ("11988887777") ou
 * em formato imprevisível vindo do assistente (fala transcrita pelo Gemini).
 * Normalizar aqui garante uma única representação no banco, sem impor
 * regra de quantidade de dígitos ou DDD (o SPEC não define isso).
 */
export function normalizarTelefone(cellPhone: string): string {
  return cellPhone.replace(/\D/g, '');
}
