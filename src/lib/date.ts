// src/lib/date.ts
export function startOfUtcDay(date = new Date()): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  
  export function sevenDaysAgoUtc(date = new Date()): Date {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - 6); // inclusive window: today and 6 days back
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }  