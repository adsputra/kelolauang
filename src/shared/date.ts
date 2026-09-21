const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toLocalDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function formatTransactionDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const parsed = parseDateOnly(value);
  return parsed ? new Intl.DateTimeFormat('id-ID', options).format(parsed) : 'Tanggal tidak valid';
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function startOfLastSevenDays(today = startOfToday()): Date {
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  return start;
}

export function getPastCalendarMonths(count: number, now = new Date()) {
  const months: Array<{ year: number; month: number; label: string }> = [];
  const formatter = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' });

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: formatter.format(date),
    });
  }

  return months;
}
