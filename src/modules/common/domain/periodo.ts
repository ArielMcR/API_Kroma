/**
 * Limites de periodo em hora LOCAL.
 *
 * `new Date('2026-08-01')` e interpretado pelo ECMAScript como meia-noite
 * **UTC**. No Brasil (UTC-3) isso e 31/07 as 21h. Como o codigo em volta aplica
 * `setHours()`, que opera em hora local, a janela inteira escorregava um dia
 * para tras: pedir agosto trazia 31/07 e perdia 31/08 inteiro.
 *
 * `appointmentDate` e gravado a meia-noite LOCAL, entao ler em local e o par
 * correto — a mesma regra que o front ja segue em `paraDataLocalISO`.
 */

const APENAS_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Meia-noite local do dia que `valor` representa. */
function paraDiaLocal(valor: Date | string): Date {
  if (typeof valor === 'string') {
    if (APENAS_DATA.test(valor)) {
      const [ano, mes, dia] = valor.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }

    // ISO com hora/offset e um INSTANTE — deixa o Date resolver e so entao le
    // os componentes locais. Fatiar os 10 primeiros caracteres daria o dia em
    // UTC, que das 21h em diante no Brasil ja e o dia seguinte.
    const instante = new Date(valor);
    return new Date(
      instante.getFullYear(),
      instante.getMonth(),
      instante.getDate(),
    );
  }

  return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
}

/** Inicio do dia: 00:00:00.000 local. */
export function inicioDoDia(valor: Date | string): Date {
  return paraDiaLocal(valor);
}

/** Fim do dia: 23:59:59.999 local. */
export function fimDoDia(valor: Date | string): Date {
  const data = paraDiaLocal(valor);
  data.setHours(23, 59, 59, 999);
  return data;
}

/**
 * `YYYY-MM-DD` a partir dos componentes LOCAIS.
 *
 * Nunca use `toISOString().slice(0, 10)` para isso: sobre um Date em fim de dia
 * local ele devolve o dia SEGUINTE, e era assim que a API ecoava um periodo
 * diferente do que realmente filtrou.
 */
export function paraDataLocalISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
