import { beforeEach, describe, expect, it } from "vitest";

import { ProgressController } from "./controller";
import { STORAGE_KEY, createInitialState, type ProgressState } from "./schema";
import { LocalProgressStore } from "./store";

const CHAPTER = "ephesians-01";

function savedState(): ProgressState {
  const state = createInitialState();
  return {
    ...state,
    chapters: {
      [CHAPTER]: {
        maxReadingPercent: 64,
        lastSectionId: "ephesians-01-metaphor",
        checkpointPassed: true,
        checkpointMisses: 0,
        reflectionCompleted: false,
        chapterCompleted: false,
      },
    },
    preferences: { theme: "dark", fontSize: "lg", speechRate: 1 },
    feedback: null,
  };
}

describe("LocalProgressStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores saved progress, position and preferences", () => {
    new LocalProgressStore().save(savedState());

    const restored = new LocalProgressStore().load();
    const chapter = restored.chapters[CHAPTER];
    expect(chapter?.maxReadingPercent).toBe(64);
    expect(chapter?.lastSectionId).toBe("ephesians-01-metaphor");
    expect(chapter?.checkpointPassed).toBe(true);
    expect(chapter?.chapterCompleted).toBe(false);
    expect(restored.preferences.theme).toBe("dark");
    expect(restored.preferences.fontSize).toBe("lg");
  });

  it("falls back safely when the stored JSON is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json at all");
    expect(new LocalProgressStore().load()).toEqual(createInitialState());
  });

  it("falls back safely when the stored shape is invalid", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, chapters: "nope", preferences: {}, feedback: null }),
    );
    expect(new LocalProgressStore().load()).toEqual(createInitialState());
    // The unusable entry is cleared rather than left to fail again.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("falls back safely when the stored schema version is older", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 0, chapters: {} }));
    expect(new LocalProgressStore().load()).toEqual(createInitialState());
  });

  it("clears only this application's key", () => {
    window.localStorage.setItem("someone-elses-key", "keep me");
    const store = new LocalProgressStore();
    store.save(savedState());

    store.clear();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem("someone-elses-key")).toBe("keep me");
  });
});

describe("ProgressController", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists reading progress monotonically across reloads", () => {
    const controller = new ProgressController(new LocalProgressStore());
    controller.reportReadingPercent(CHAPTER, 30);
    controller.reportReadingPercent(CHAPTER, 70);
    controller.reportReadingPercent(CHAPTER, 5);

    const reopened = new ProgressController(new LocalProgressStore());
    expect(reopened.chapter(CHAPTER).maxReadingPercent).toBe(70);
  });

  it("reaches 100% only after checkpoint and reflection, and survives a reload", () => {
    const controller = new ProgressController(new LocalProgressStore());
    controller.reportReadingPercent(CHAPTER, 88);
    controller.setCheckpointPassed(CHAPTER);
    expect(controller.chapter(CHAPTER).chapterCompleted).toBe(false);

    controller.completeChapter(CHAPTER);

    const reopened = new ProgressController(new LocalProgressStore()).chapter(CHAPTER);
    expect(reopened.chapterCompleted).toBe(true);
    expect(reopened.reflectionCompleted).toBe(true);
    expect(reopened.maxReadingPercent).toBe(90);
  });

  it("keeps the entry snapshot fixed while reading continues", () => {
    const first = new ProgressController(new LocalProgressStore());
    first.reportReadingPercent(CHAPTER, 40);
    first.reportSection(CHAPTER, "ephesians-01-context");

    const reopened = new ProgressController(new LocalProgressStore());
    expect(reopened.entryChapter(CHAPTER).lastSectionId).toBe("ephesians-01-context");

    reopened.reportSection(CHAPTER, "ephesians-01-application");
    expect(reopened.chapter(CHAPTER).lastSectionId).toBe("ephesians-01-application");
    expect(reopened.entryChapter(CHAPTER).lastSectionId).toBe("ephesians-01-context");
  });

  it("resets to a clean state and notifies subscribers", () => {
    const controller = new ProgressController(new LocalProgressStore());
    controller.reportReadingPercent(CHAPTER, 55);
    let notified = 0;
    controller.subscribe(() => {
      notified += 1;
    });

    controller.resetAll();

    expect(notified).toBe(1);
    expect(controller.getSnapshot()).toEqual(createInitialState());
    expect(new LocalProgressStore().load()).toEqual(createInitialState());
  });
});
