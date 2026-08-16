import { fimDoDia, inicioDoDia, paraDataLocalISO } from './periodo';

/**
 * O bug original so aparece em fuso NEGATIVO (o Brasil e UTC-3): `new
 * Date('2026-08-01')` e meia-noite UTC, que la e 31/07 as 21h. Estes testes
 * afirmam a invariante de ida-e-volta, que e o que precisa valer em qualquer
 * lugar: o dia que entra e o dia que sai.
 */
describe('periodo', () => {
  describe('inicioDoDia', () => {
    it('le YYYY-MM-DD como dia LOCAL, sem escorregar para o dia anterior', () => {
      const inicio = inicioDoDia('2026-08-01');

      expect(inicio.getFullYear()).toBe(2026);
      expect(inicio.getMonth()).toBe(7); // agosto
      expect(inicio.getDate()).toBe(1);
      expect(inicio.getHours()).toBe(0);
      expect(inicio.getMinutes()).toBe(0);
      expect(inicio.getSeconds()).toBe(0);
      expect(inicio.getMilliseconds()).toBe(0);
    });

    it('resolve ISO completo pelo INSTANTE, nao pelos 10 primeiros caracteres', () => {
      // 15/08 as 22h no Brasil ja e 16/08 em UTC. Fatiar a string daria o dia
      // errado; o correto e converter o instante e ler os componentes locais.
      const noite = new Date(2026, 7, 15, 22, 0, 0);
      const inicio = inicioDoDia(noite.toISOString());

      expect(inicio.getDate()).toBe(15);
      expect(inicio.getMonth()).toBe(7);
      expect(inicio.getHours()).toBe(0);
    });

    it('aceita Date e normaliza para a meia-noite local', () => {
      const inicio = inicioDoDia(new Date(2026, 7, 16, 14, 30, 45, 123));

      expect(inicio.getDate()).toBe(16);
      expect(inicio.getHours()).toBe(0);
      expect(inicio.getMilliseconds()).toBe(0);
    });
  });

  describe('fimDoDia', () => {
    it('termina em 23:59:59.999 do dia pedido', () => {
      const fim = fimDoDia('2026-08-31');

      expect(fim.getDate()).toBe(31);
      expect(fim.getMonth()).toBe(7);
      expect(fim.getHours()).toBe(23);
      expect(fim.getMinutes()).toBe(59);
      expect(fim.getSeconds()).toBe(59);
      expect(fim.getMilliseconds()).toBe(999);
    });

    it('inclui um atendimento no fim do ultimo dia do periodo', () => {
      // Era exatamente isto que se perdia: pedindo ate 31/08, o filtro parava
      // em 30/08 e o movimento do dia 31 sumia do faturamento.
      const fim = fimDoDia('2026-08-31');
      const atendimento = new Date(2026, 7, 31, 19, 30);

      expect(atendimento.getTime()).toBeLessThanOrEqual(fim.getTime());
    });

    it('nao deixa vazar o dia anterior ao inicio do periodo', () => {
      const inicio = inicioDoDia('2026-08-01');
      const vespera = new Date(2026, 6, 31, 19, 30);

      expect(vespera.getTime()).toBeLessThan(inicio.getTime());
    });
  });

  describe('paraDataLocalISO', () => {
    it('devolve o mesmo dia que entrou (ida e volta)', () => {
      expect(paraDataLocalISO(inicioDoDia('2026-08-01'))).toBe('2026-08-01');
      expect(paraDataLocalISO(fimDoDia('2026-08-31'))).toBe('2026-08-31');
    });

    it('nao pula para o dia seguinte no fim do dia', () => {
      // `toISOString().slice(0,10)` sobre 23:59 local em UTC-3 devolvia o dia
      // seguinte — a API ecoava um periodo diferente do que filtrou.
      expect(paraDataLocalISO(fimDoDia('2026-12-31'))).toBe('2026-12-31');
    });

    it('preenche mes e dia com zero a esquerda', () => {
      expect(paraDataLocalISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });
});
