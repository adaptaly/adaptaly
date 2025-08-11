// src/lib/number.ts
export function formatInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "0";
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "–";
  return `${Math.round(n)}%`;
}

export function formatDelta(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n) || n === 0) return "±0";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}`;
}