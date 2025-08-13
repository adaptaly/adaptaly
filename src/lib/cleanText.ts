// New
// src/lib/cleanText.ts

type CleanOpts = {
    maxLength?: number; // safety cap
  };
  
  export function cleanText(input: string, opts: CleanOpts = {}): string {
    if (!input) return "";
    const maxLen = opts.maxLength ?? 1_000_000;
  
    let t = input;
  
    // Normalize line endings
    t = t.replace(/\r\n?/g, "\n");
  
    // Remove clearly empty columns or excessive indentation
    t = t.replace(/[ \t]+\n/g, "\n");
  
    // Join hyphenated line breaks like "inter-\nnational" -> "international"
    t = t.replace(/([A-Za-z])-\n([A-Za-z])/g, "$1$2");
  
    // Remove standalone page numbers or "Page X of Y" lines
    t = t.replace(/^\s*(page\s+\d+(\s+of\s+\d+)?)\s*$/gim, "");
    t = t.replace(/^\s*\d{1,4}\s*$/gim, "");
  
    // Trim repeated headers and footers:
    // Heuristic - find lines repeated 6+ times and drop them entirely
    const lines = t.split("\n");
    const freq = new Map<string, number>();
    for (const line of lines) {
      const key = line.trim();
      if (!key) continue;
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
    const noisy = new Set(
      Array.from(freq.entries())
        .filter(([k, v]) => v >= 6 && k.length <= 80)
        .map(([k]) => k)
    );
    if (noisy.size > 0) {
      t = lines.filter((ln) => !noisy.has(ln.trim())).join("\n");
    }
  
    // Collapse 3+ blank lines to 1
    t = t.replace(/\n{3,}/g, "\n\n");
  
    // Trim overall and cap length
    t = t.trim();
    if (t.length > maxLen) t = t.slice(0, maxLen);
  
    return t;
  }  