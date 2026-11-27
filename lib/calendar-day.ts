/** Datas do calendário usam meio-dia UTC para não mudar de dia por fuso/DST. */
export function calendarDay(value: string | Date): Date | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12)) : null;
}
