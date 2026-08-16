import { mergeReadingPercent, withChapterCompleted } from "./logic";
import {
  createInitialState,
  emptyChapterProgress,
  type ChapterProgress,
  type Feedback,
  type FontSizePreference,
  type ProgressState,
  type ThemePreference,
} from "./schema";
import { LocalProgressStore, type ProgressStore } from "./store";

/** Stable snapshot used during SSR and the hydration render. */
const SERVER_STATE: ProgressState = Object.freeze(createInitialState());

/**
 * Reactive wrapper around a {@link ProgressStore}, shaped for
 * `useSyncExternalStore`: the snapshot is cached so repeated reads during a
 * render are referentially stable, and every mutation persists then notifies.
 */
export class ProgressController {
  private readonly store: ProgressStore;
  private readonly listeners = new Set<() => void>();
  private snapshot: ProgressState | null = null;
  /** The state as it was when this device session started — used for "resume". */
  private entry: ProgressState | null = null;

  constructor(store: ProgressStore = new LocalProgressStore()) {
    this.store = store;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Reads storage once, then serves the cached snapshot. */
  getSnapshot = (): ProgressState => {
    if (this.snapshot === null) {
      this.snapshot = this.store.load();
      this.entry = this.snapshot;
    }
    return this.snapshot;
  };

  getServerSnapshot = (): ProgressState => SERVER_STATE;

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private update(updater: (previous: ProgressState) => ProgressState): void {
    const previous = this.getSnapshot();
    const next = updater(previous);
    if (next === previous) return;
    this.snapshot = next;
    this.store.save(next);
    this.emit();
  }

  chapter(chapterKey: string): ChapterProgress {
    return this.getSnapshot().chapters[chapterKey] ?? emptyChapterProgress;
  }

  /**
   * Progress as it stood when the page was opened. Stays fixed while the
   * reader scrolls, so the "resume where you left off" offer does not move.
   */
  entryChapter(chapterKey: string): ChapterProgress {
    this.getSnapshot();
    return this.entry?.chapters[chapterKey] ?? emptyChapterProgress;
  }

  private updateChapter(
    chapterKey: string,
    updater: (previous: ChapterProgress) => ChapterProgress,
  ): void {
    this.update((previous) => {
      const current = previous.chapters[chapterKey] ?? emptyChapterProgress;
      const next = updater(current);
      const unchanged =
        next.maxReadingPercent === current.maxReadingPercent &&
        next.lastSectionId === current.lastSectionId &&
        next.checkpointPassed === current.checkpointPassed &&
        next.reflectionCompleted === current.reflectionCompleted &&
        next.chapterCompleted === current.chapterCompleted;
      if (unchanged) return previous;
      return { ...previous, chapters: { ...previous.chapters, [chapterKey]: next } };
    });
  }

  reportReadingPercent(chapterKey: string, observed: number): void {
    this.updateChapter(chapterKey, (previous) => ({
      ...previous,
      maxReadingPercent: mergeReadingPercent(previous.maxReadingPercent, observed),
    }));
  }

  reportSection(chapterKey: string, sectionId: string): void {
    this.updateChapter(chapterKey, (previous) => ({ ...previous, lastSectionId: sectionId }));
  }

  setCheckpointPassed(chapterKey: string): void {
    this.updateChapter(chapterKey, (previous) => ({ ...previous, checkpointPassed: true }));
  }

  completeChapter(chapterKey: string): void {
    this.updateChapter(chapterKey, withChapterCompleted);
  }

  setTheme(theme: ThemePreference): void {
    this.update((previous) => ({
      ...previous,
      preferences: { ...previous.preferences, theme },
    }));
  }

  setFontSize(fontSize: FontSizePreference): void {
    this.update((previous) => ({
      ...previous,
      preferences: { ...previous.preferences, fontSize },
    }));
  }

  saveFeedback(feedback: Feedback): void {
    this.update((previous) => ({ ...previous, feedback }));
  }

  /** Clears only this application's stored data on this device. */
  resetAll(): void {
    this.store.clear();
    this.snapshot = createInitialState();
    this.entry = this.snapshot;
    this.emit();
  }
}
