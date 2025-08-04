export function getDeviceId(): string {
    const k = "adaptaly:device";
    let v = typeof window !== "undefined" ? localStorage.getItem(k) : null;
    if (!v && typeof crypto !== "undefined") {
      v = crypto.randomUUID();
      if (typeof window !== "undefined") localStorage.setItem(k, v);
    }
    return v || "unknown-device";
  }  