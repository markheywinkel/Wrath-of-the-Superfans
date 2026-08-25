"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { estimateDisplayMs } from "./timing";

/**
 * Erzähler-Stimme via Web Speech API (SpeechSynthesis), mit synchronem
 * Untertitel-State. Kein Audio-Asset nötig - passt zum Rest des Projekts,
 * das bewusst ohne Asset-Pipeline auskommt.
 *
 * Zeigt jeweils eine Zeile für ihre geschätzte Lesedauer an und spricht sie
 * optional zusätzlich. Bewusst ohne Warteschlange/"onend"-Abhängigkeit: die
 * Anzeigedauer ist die einzige Quelle der Wahrheit, damit eine hängende oder
 * nie feuernde Sprachausgabe (in manchen Browsern reproduzierbar) niemals das
 * Fortschreiten blockieren kann. Die Sequenzierung mehrerer Zeilen
 * übernimmt der Aufrufer (siehe NarratorWorld).
 */
export function useVoiceOver() {
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(false);

  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang?.toLowerCase().startsWith("de")) ?? voices[0] ?? null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
  }, []);

  const speak = useCallback(
    (line: string) => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setSubtitle(line);
      clearTimerRef.current = setTimeout(() => setSubtitle(null), estimateDisplayMs(line));

      if (supported && !mutedRef.current) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(line);
          utterance.lang = "de-DE";
          if (voiceRef.current) utterance.voice = voiceRef.current;
          utterance.rate = 0.98;
          utterance.pitch = 0.92;
          window.speechSynthesis.speak(utterance);
        } catch {
          // Untertitel laufen per Timer ohnehin weiter, Sprachausgabe ist optional.
        }
      }
    },
    [supported]
  );

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (next && supported) window.speechSynthesis.cancel();
      return next;
    });
  }, [supported]);

  useEffect(
    () => () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (supported) window.speechSynthesis.cancel();
    },
    [supported]
  );

  return { subtitle, speak, muted, toggleMuted, supported };
}

export type VoiceOver = ReturnType<typeof useVoiceOver>;
