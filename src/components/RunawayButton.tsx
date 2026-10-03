"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

interface Props {
  label: string;
  /** Called every time someone tries to press it. */
  onAttempt?: () => void;
  /** Element the button must never land on (usually the "Yes" button). */
  avoidRef?: RefObject<HTMLElement | null>;
  className?: string;
}

interface Pos {
  x: number;
  y: number;
}

const MARGIN = 12;

function overlaps(a: DOMRect, x: number, y: number, w: number, h: number, pad: number) {
  return !(
    x + w + pad < a.left ||
    x - pad > a.right ||
    y + h + pad < a.top ||
    y - pad > a.bottom
  );
}

/**
 * A button that can never be pressed.
 *  - Desktop: it jumps away as soon as the mouse enters it.
 *  - Touch:   it jumps away on touch-down, before a click can register.
 *  - Keyboard: Enter/Space trigger onClick, which also just makes it jump.
 * Once it starts running it's portalled to <body> with position:fixed so
 * transformed ancestors can't trap it, and it roams the whole viewport.
 */
export function RunawayButton({ label, onAttempt, avoidRef, className = "" }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const flee = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const maxX = Math.max(MARGIN, vw - rect.width - MARGIN);
    const maxY = Math.max(MARGIN, vh - rect.height - MARGIN);
    const avoid = avoidRef?.current?.getBoundingClientRect();
    // Must land far enough away that the pointer/finger is no longer on it.
    const minJump = Math.min(160, Math.max(vw, vh) / 4);

    let next: Pos = { x: MARGIN + Math.random() * (maxX - MARGIN), y: MARGIN + Math.random() * (maxY - MARGIN) };
    for (let i = 0; i < 40; i++) {
      const cand = {
        x: MARGIN + Math.random() * (maxX - MARGIN),
        y: MARGIN + Math.random() * (maxY - MARGIN),
      };
      const far = Math.hypot(cand.x - rect.left, cand.y - rect.top) >= minJump;
      const clear = !avoid || !overlaps(avoid, cand.x, cand.y, rect.width, rect.height, 16);
      next = cand;
      if (far && clear) break;
    }
    setPos(next);
    onAttempt?.();
  }, [avoidRef, onAttempt]);

  // Keep it on-screen when the viewport changes (rotation, keyboard, resize).
  useEffect(() => {
    if (!pos) return;
    const clamp = () => {
      const el = btnRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      setPos((p) =>
        p && {
          x: Math.min(p.x, Math.max(MARGIN, window.innerWidth - width - MARGIN)),
          y: Math.min(p.y, Math.max(MARGIN, window.innerHeight - height - MARGIN)),
        },
      );
    };
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [pos]);

  const button = (
    <button
      ref={btnRef}
      type="button"
      className={`select-none touch-none whitespace-nowrap ${className}`}
      style={
        pos
          ? {
              position: "fixed",
              left: pos.x,
              top: pos.y,
              zIndex: 60,
              transition: "left 0.28s cubic-bezier(.2,.9,.3,1.3), top 0.28s cubic-bezier(.2,.9,.3,1.3)",
            }
          : undefined
      }
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") flee();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        flee();
      }}
      onClick={(e) => {
        // Only reachable via keyboard or assistive tech – still never counts as "No".
        e.preventDefault();
        flee();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );

  if (!pos || !mounted) return button;

  return (
    <>
      {/* Invisible placeholder so the layout doesn't jump when the button leaves. */}
      <span aria-hidden className={`invisible whitespace-nowrap ${className}`}>
        {label}
      </span>
      {createPortal(button, document.body)}
    </>
  );
}
