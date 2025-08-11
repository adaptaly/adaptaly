// src/lib/date.ts
export function startOfUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function daysAgoUtc(n: number, from = new Date()): Date {
  const x = new Date(from);
  x.setUTCDate(x.getUTCDate() - n);
  return x;
}

export function startOfDayDaysAgoUtc(n: number, from = new Date()): Date {
  return startOfUtcDay(daysAgoUtc(n, from));
}

export function iso(d: Date): string {
  return d.toISOString();
}