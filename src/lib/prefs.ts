// src/lib/prefs.ts
// Reads/writes user preferences. Falls back to sensible defaults.

export type UserPrefs = {
    minutes_goal: number;                  // 15 | 20 | 25 | 30
    default_action: "due" | "quick" | "topic";
    reminder_enabled: boolean;
    reminder_time: string | null;          // "18:00" (24h local) or null
    reminder_days: number[];               // 0..6 (Sun..Sat)
    timezone: string | null;               // IANA tz, e.g. "Europe/Amsterdam"
    updated_at?: string;
  };
  
  export const DEFAULT_PREFS: UserPrefs = {
    minutes_goal: 25,
    default_action: "due",
    reminder_enabled: false,
    reminder_time: null,
    reminder_days: [1,2,3,4,5],            // weekdays
    timezone: null,
  };
  
  type SB = any;
  
  export async function getUserPrefsServer(supabase: SB, userId: string): Promise<UserPrefs> {
    try {
      const { data, error } = await supabase
        .from("user_prefs")
        .select(
          "minutes_goal, default_action, reminder_enabled, reminder_time, reminder_days, timezone, updated_at"
        )
        .eq("user_id", userId)
        .maybeSingle();
  
      if (error || !data) return { ...DEFAULT_PREFS };
      const days = Array.isArray(data.reminder_days)
        ? (data.reminder_days as number[]).filter((n) => Number.isInteger(n))
        : DEFAULT_PREFS.reminder_days;
  
      return {
        minutes_goal: data.minutes_goal ?? DEFAULT_PREFS.minutes_goal,
        default_action: (data.default_action as UserPrefs["default_action"]) ?? DEFAULT_PREFS.default_action,
        reminder_enabled: !!data.reminder_enabled,
        reminder_time: data.reminder_time ?? null,
        reminder_days: days,
        timezone: data.timezone ?? null,
        updated_at: data.updated_at ?? undefined,
      };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }
  
  export async function saveUserPrefsClient(supabase: SB, userId: string, prefs: UserPrefs) {
    const payload = {
      user_id: userId,
      minutes_goal: prefs.minutes_goal,
      default_action: prefs.default_action,
      reminder_enabled: prefs.reminder_enabled,
      reminder_time: prefs.reminder_time,
      reminder_days: prefs.reminder_days,
      timezone: prefs.timezone,
      updated_at: new Date().toISOString(),
    };
    // upsert
    const { error } = await supabase.from("user_prefs").upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
  }  