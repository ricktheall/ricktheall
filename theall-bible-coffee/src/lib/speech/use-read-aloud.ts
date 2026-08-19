"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Read-aloud built on the browser's own speech synthesis.
 *
 * Nothing is uploaded — the device speaks the text locally. The chapter is cut
 * into one utterance per paragraph so a listener can pause, resume, or skip,
 * and so the page can highlight and follow whatever is being spoken.
 */

export interface SpeechPassage {
  /** DOM id of the element holding this passage. */
  elementId: string;
  text: string;
}

export type ReadAloudStatus = "unsupported" | "idle" | "speaking" | "paused";

interface ReadAloudOptions {
  passages: readonly SpeechPassage[];
  rate: number;
  lang?: string;
}

interface ReadAloudControls {
  status: ReadAloudStatus;
  /** Index into `passages`, or -1 when nothing is being read. */
  currentIndex: number;
  start: (fromIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
}

const subscribeNever = () => () => {};

function supportsSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Prefers a Thai voice, falling back to whatever the device offers. */
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const exact = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const prefix = lang.split("-")[0]?.toLowerCase() ?? "";
  return voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ?? null;
}

export function useReadAloud({
  passages,
  rate,
  lang = "th-TH",
}: ReadAloudOptions): ReadAloudControls {
  // Resolved on the client only, so server and client markup agree.
  const supported = useSyncExternalStore(subscribeNever, supportsSpeech, () => false);

  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Latest passages/rate, kept in refs so a long-lived utterance chain always
  // reads current values without re-creating itself mid-playback.
  const passagesRef = useRef(passages);
  const rateRef = useRef(rate);
  /** Guards against `onend` firing for an utterance we deliberately cancelled. */
  const runRef = useRef(0);
  /** Lets an utterance's `onend` chain into the next passage without self-reference. */
  const speakFromRef = useRef<(index: number) => void>(() => {});

  const speakFrom = useCallback(
    (index: number) => {
      if (!supported) return;
      const list = passagesRef.current;
      if (index < 0 || index >= list.length) {
        window.speechSynthesis.cancel();
        setStatus("idle");
        setCurrentIndex(-1);
        return;
      }

      const run = runRef.current + 1;
      runRef.current = run;
      window.speechSynthesis.cancel();

      const passage = list[index];
      if (!passage) return;

      const utterance = new SpeechSynthesisUtterance(passage.text);
      utterance.lang = lang;
      utterance.rate = rateRef.current;
      const voice = pickVoice(lang);
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (runRef.current !== run) return;
        speakFromRef.current(index + 1);
      };
      utterance.onerror = () => {
        if (runRef.current !== run) return;
        setStatus("idle");
        setCurrentIndex(-1);
      };

      setCurrentIndex(index);
      setStatus("speaking");
      window.speechSynthesis.speak(utterance);
    },
    [lang, supported],
  );

  useEffect(() => {
    passagesRef.current = passages;
  }, [passages]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    speakFromRef.current = speakFrom;
  }, [speakFrom]);

  const start = useCallback(
    (fromIndex = 0) => {
      speakFrom(fromIndex);
    },
    [speakFrom],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus("speaking");
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    runRef.current += 1;
    window.speechSynthesis.cancel();
    setStatus("idle");
    setCurrentIndex(-1);
  }, [supported]);

  const next = useCallback(() => speakFrom(currentIndex + 1), [currentIndex, speakFrom]);
  const previous = useCallback(
    () => speakFrom(Math.max(currentIndex - 1, 0)),
    [currentIndex, speakFrom],
  );

  // Never leave a voice talking after the reader navigates away.
  useEffect(() => {
    if (!supported) return;
    return () => {
      runRef.current += 1;
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  return {
    status: supported ? status : "unsupported",
    currentIndex,
    start,
    pause,
    resume,
    stop,
    next,
    previous,
  };
}

/** Flattens a chapter's readable blocks into ordered passages for speech. */
export function collectPassages(root: HTMLElement | null): SpeechPassage[] {
  if (!root) return [];
  const nodes = root.querySelectorAll<HTMLElement>("[data-speak]");
  const passages: SpeechPassage[] = [];
  nodes.forEach((node) => {
    const text = (node.textContent ?? "").trim();
    if (text.length > 0 && node.id) passages.push({ elementId: node.id, text });
  });
  return passages;
}
