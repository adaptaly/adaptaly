// src/lib/number.ts
export function formatInt(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return "0";
    return new Intl.NumberFormat("en", { notation: "standard", maximumFractionDigits: 0 }).format(n);
  }
  
  export function formatPercent(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return "–";
    return `${Math.round(n)}%`;
  }  