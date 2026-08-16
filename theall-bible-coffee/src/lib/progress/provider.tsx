"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { ProgressController } from "./controller";
import type {
  BookProgress,
  ChapterProgress,
  Feedback,
  FontSizePreference,
  ProgressState,
  ThemePreference,
} from "./schema";
import type { ProgressStore } from "./store";

interface ProgressContextValue {
  /** False during SSR and the hydration render, true once storage has been read. */
  hydrated: boolean;
  state: ProgressState;
  chapter(chapterKey: string): ChapterProgress;
  /** Book-level progress for the 66-cup journey. */
  book(bookId: string): BookProgress;
  /** Progress as it was when the page opened; does not move while reading. */
  entryChapter(chapterKey: string): ChapterProgress;
  reportReadingPercent(chapterKey: string, observed: number): void;
  reportSection(chapterKey: string, sectionId: string): void;
  setCheckpointPassed(chapterKey: string): void;
  completeChapter(chapterKey: string): void;
  markBookCelebrated(bookId: string): void;
  setTheme(theme: ThemePreference): void;
  setFontSize(fontSize: FontSizePreference): void;
  saveFeedback(feedback: Feedback): void;
  resetAll(): void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const noopSubscribe = () => () => {};

export function applyPreferences(theme: ThemePreference, fontSize: FontSizePreference): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", prefersDark);
  root.dataset["theme"] = theme;
  root.dataset["fontSize"] = fontSize;
  root.style.colorScheme = prefersDark ? "dark" : "light";
}

export function ProgressProvider({
  children,
  store,
}: {
  children: ReactNode;
  store?: ProgressStore;
}) {
  const [controller] = useState(() => new ProgressController(store));

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );

  // True only after hydration, so server and client markup always agree.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const { theme, fontSize } = state.preferences;

  // Keep the document in sync with stored preferences (the inline bootstrap
  // script has already applied them before first paint).
  useEffect(() => {
    applyPreferences(theme, fontSize);
  }, [theme, fontSize]);

  // Follow the OS while the reader is on "system".
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPreferences("system", fontSize);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme, fontSize]);

  const chapter = useCallback((chapterKey: string) => controller.chapter(chapterKey), [controller]);
  const book = useCallback((bookId: string) => controller.book(bookId), [controller]);
  const entryChapter = useCallback(
    (chapterKey: string) => controller.entryChapter(chapterKey),
    [controller],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      hydrated,
      state,
      chapter,
      book,
      entryChapter,
      reportReadingPercent: (chapterKey, observed) =>
        controller.reportReadingPercent(chapterKey, observed),
      reportSection: (chapterKey, sectionId) => controller.reportSection(chapterKey, sectionId),
      setCheckpointPassed: (chapterKey) => controller.setCheckpointPassed(chapterKey),
      completeChapter: (chapterKey) => controller.completeChapter(chapterKey),
      markBookCelebrated: (bookId) => controller.markBookCelebrated(bookId),
      setTheme: (nextTheme) => controller.setTheme(nextTheme),
      setFontSize: (nextFontSize) => controller.setFontSize(nextFontSize),
      saveFeedback: (feedback) => controller.saveFeedback(feedback),
      resetAll: () => controller.resetAll(),
    }),
    [book, chapter, controller, entryChapter, hydrated, state],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used inside <ProgressProvider>");
  }
  return context;
}
