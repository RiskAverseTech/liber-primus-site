"use client";
import { useEffect } from "react";

/**
 * One audio element for the whole page. Buttons with class "play" carry their
 * clips in data-clips ("|"-separated paths); a click plays them in order with a
 * short gap, a second click on the same button stops, and a click on another
 * button switches to it. Listens on the document because the buttons live in
 * injected HTML.
 */
export default function AudioPlayer() {
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    let active: HTMLButtonElement | null = null;
    let queue: string[] = [];
    let timer = 0;

    const mark = (b: HTMLButtonElement | null) => {
      active?.classList.remove("playing");
      active?.setAttribute("aria-pressed", "false");
      active = b;
      b?.classList.add("playing");
      b?.setAttribute("aria-pressed", "true");
    };
    const stop = () => { window.clearTimeout(timer); queue = []; audio.pause(); mark(null); };
    const next = () => {
      const src = queue.shift();
      if (!src) { mark(null); return; }
      audio.src = src;
      audio.play().catch(stop);
    };
    const onEnded = () => { if (queue.length) timer = window.setTimeout(next, 400); else mark(null); };
    const onClick = (e: MouseEvent) => {
      const b = (e.target as HTMLElement | null)?.closest?.("button.play") as HTMLButtonElement | null;
      if (!b) return;
      e.preventDefault();
      if (b === active) { stop(); return; }
      stop();
      mark(b);
      queue = (b.dataset.clips ?? "").split("|").filter(Boolean);
      next();
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", stop);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", stop);
      stop();
    };
  }, []);
  return null;
}
