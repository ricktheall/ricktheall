import { STORAGE_KEY, createInitialState, progressStateSchema, type ProgressState } from "./schema";

/**
 * Storage boundary. The UI only ever talks to this interface, so the local
 * implementation can be swapped for a database-backed one later without
 * touching components.
 */
export interface ProgressStore {
  load(): ProgressState;
  save(state: ProgressState): void;
  clear(): void;
}

/** Used when `localStorage` is unavailable (SSR, private mode, blocked storage). */
export class MemoryProgressStore implements ProgressStore {
  private state: ProgressState = createInitialState();

  load(): ProgressState {
    return this.state;
  }

  save(state: ProgressState): void {
    this.state = state;
  }

  clear(): void {
    this.state = createInitialState();
  }
}

export class LocalProgressStore implements ProgressStore {
  private readonly key: string;
  private readonly fallback = new MemoryProgressStore();

  constructor(key: string = STORAGE_KEY) {
    this.key = key;
  }

  private storage(): Storage | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      // Touch the API so blocked-storage environments fail here, not later.
      const probe = "__theall_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch {
      return null;
    }
  }

  load(): ProgressState {
    const storage = this.storage();
    if (!storage) return this.fallback.load();

    try {
      const raw = storage.getItem(this.key);
      if (raw === null) return createInitialState();

      const parsed = progressStateSchema.safeParse(JSON.parse(raw) as unknown);
      if (!parsed.success) {
        // Corrupted, hand-edited, or written by an older schema: start clean
        // rather than break the reading page.
        storage.removeItem(this.key);
        return createInitialState();
      }
      return parsed.data;
    } catch {
      return createInitialState();
    }
  }

  save(state: ProgressState): void {
    const storage = this.storage();
    if (!storage) {
      this.fallback.save(state);
      return;
    }
    try {
      storage.setItem(this.key, JSON.stringify(state));
    } catch {
      // Quota or permission failure must never interrupt reading.
      this.fallback.save(state);
    }
  }

  /** Removes only this application's key — never the whole origin. */
  clear(): void {
    const storage = this.storage();
    this.fallback.clear();
    if (!storage) return;
    try {
      storage.removeItem(this.key);
    } catch {
      /* ignore */
    }
  }
}
