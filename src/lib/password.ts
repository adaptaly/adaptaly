// src/lib/password.ts
export type PasswordValidation = {
    ok: boolean;
    issues: string[];
  };
  
  export function validatePassword(pw: string): PasswordValidation {
    const issues: string[] = [];
    if (pw.length < 8) issues.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) issues.push("At least one uppercase letter");
    if (!/[a-z]/.test(pw)) issues.push("At least one lowercase letter");
    if (!/[0-9]/.test(pw)) issues.push("At least one number");
    if (!/[^\w\s]/.test(pw)) issues.push("At least one special character");
  
    return { ok: issues.length === 0, issues };
  }
  
  export function calcStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^\w\s]/.test(pw)) score++;
    return score as 0 | 1 | 2 | 3 | 4;
  }  