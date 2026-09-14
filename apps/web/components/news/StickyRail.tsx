'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Breathing room between the rail and the edge of the screen. */
const GAP = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Held against the top of the screen, against the bottom, or moving freely. */
type Mode = 'top' | 'bottom' | 'free';

/**
 * Keeps a tall sidebar in view from both directions. Scrolling down it travels
 * with the page and holds once its last item reaches the bottom of the screen;
 * scrolling back up it travels again and holds once its first item reaches the
 * top; and back at the top of the page it sits exactly where it started.
 *
 * While held, the rail is `position: fixed`, so the browser keeps it against
 * the viewport with nothing running per frame — that is what stops it shaking.
 * Script runs only at the moments it changes between held and free, and each of
 * those happens where the held and natural positions are the same pixel, so the
 * change cannot be seen.
 */
export function StickyRail({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const rail = railRef.current;
    if (!track || !rail) return;

    let mode: Mode = 'free';
    /** How far down the track the rail rests while free. */
    let parked = 0;
    let lastScrollY = window.scrollY;

    const measure = () => {
      const rect = track.getBoundingClientRect();
      const style = getComputedStyle(track);
      const padTop = Number.parseFloat(style.paddingTop) || 0;
      const padBottom = Number.parseFloat(style.paddingBottom) || 0;
      const padLeft = Number.parseFloat(style.paddingLeft) || 0;
      const padRight = Number.parseFloat(style.paddingRight) || 0;
      const top = rect.top + padTop;
      const bottom = rect.bottom - padBottom;
      const height = rail.offsetHeight;

      return {
        top,
        bottom,
        height,
        left: rect.left + padLeft,
        width: rect.width - padLeft - padRight,
        travel: Math.max(0, bottom - top - height),
        heldTop: GAP,
        // A rail shorter than the screen has no room to hold at the bottom, so
        // both ends collapse onto the top for it.
        heldBottom: Math.min(GAP, window.innerHeight - GAP - height),
      };
    };

    const paint = () => {
      if (mode === 'free') {
        rail.style.position = '';
        rail.style.top = '';
        rail.style.left = '';
        rail.style.width = '';
        rail.style.marginTop = `${Math.round(parked)}px`;
        return;
      }
      const m = measure();
      rail.style.position = 'fixed';
      rail.style.top = `${Math.round(
        mode === 'top' ? m.heldTop : m.heldBottom,
      )}px`;
      rail.style.left = `${Math.round(m.left)}px`;
      rail.style.width = `${Math.round(m.width)}px`;
      rail.style.marginTop = '0px';
    };

    const onScroll = () => {
      if (track.offsetParent === null) return;

      const scrollY = window.scrollY;
      if (scrollY === lastScrollY) return;
      const goingDown = scrollY > lastScrollY;
      lastScrollY = scrollY;

      const m = measure();
      const before = mode;

      if (mode === 'free') {
        const railTop = m.top + parked;
        // Only hold while the track still runs past that edge of the screen.
        // Without these guards the rail is held at the top of the page too,
        // dragging it above where it actually belongs.
        const roomBelow = m.bottom - m.height > m.heldBottom;
        const roomAbove = m.top < m.heldTop;
        if (goingDown && roomBelow && railTop <= m.heldBottom) mode = 'bottom';
        else if (!goingDown && roomAbove && railTop >= m.heldTop) mode = 'top';
      } else if (mode === 'bottom') {
        if (!goingDown) {
          parked = clamp(m.heldBottom - m.top, 0, m.travel);
          mode = 'free';
        } else if (m.bottom - m.height <= m.heldBottom) {
          // The track has run out; ride its end down the page.
          parked = m.travel;
          mode = 'free';
        }
      } else if (goingDown) {
        parked = clamp(m.heldTop - m.top, 0, m.travel);
        mode = 'free';
      } else if (m.top >= m.heldTop) {
        // Back at the rail's own starting point, so it belongs there again.
        // Without this it keeps whatever offset it was parked at and leaves a
        // gap above itself at the top of the page.
        parked = 0;
        mode = 'free';
      }

      if (mode !== before) paint();
    };

    const onResize = () => {
      parked = clamp(parked, 0, measure().travel);
      paint();
    };

    const observer = new ResizeObserver(onResize);
    observer.observe(rail);
    observer.observe(track);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    paint();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div ref={trackRef} className={className}>
      <div ref={railRef}>{children}</div>
    </div>
  );
}
