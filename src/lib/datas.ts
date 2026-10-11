// Datas do SQLite vêm em UTC no formato "2026-10-09 21:30:00"; exibimos no fuso de quem vê.

function deSql(sql: string): Date {
  return new Date(`${sql.replace(' ', 'T')}Z`);
}

/** "09/10/2026" */
export function formatarData(sql: string): string {
  return deSql(sql).toLocaleDateString('pt-BR');
}

/** "09/10/2026 · 21:30" */
export function formatarDataHora(sql: string): string {
  const d = deSql(sql);
  return `${d.toLocaleDateString('pt-BR')} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
