import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Cache for scroll positions across route paths
const scrollPositions: Record<string, number> = {};

/**
 * Robust scroll restoration hook for inner scrollable containers.
 * Saves scroll position per route pathname during active scrolling and reliably
 * restores it when navigating back, even after asynchronous data fetching (e.g. firearms/ammo API loads).
 */
export function useScrollRestoration(containerRef: React.RefObject<HTMLElement | null>) {
  const location = useLocation();
  const locationPathRef = useRef<string>(location.pathname);
  const isRestoringRef = useRef<boolean>(false);
  const targetScrollRef = useRef<number>(0);
  const restoreFrameRef = useRef<number | null>(null);
  const restoreTimeoutRef = useRef<number | null>(null);

  // Keep locationPathRef in sync immediately on every render pass
  locationPathRef.current = location.pathname;

  // 1. Continuous scroll listener - tracks user scroll position for the ACTIVE route
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleUserInteraction = () => {
      // User is actively interacting with the page, cancel any automatic restoration in progress
      if (isRestoringRef.current) {
        isRestoringRef.current = false;
      }
    };

    // User gesture listeners
    el.addEventListener('wheel', handleUserInteraction, { passive: true });
    el.addEventListener('touchstart', handleUserInteraction, { passive: true });
    el.addEventListener('touchmove', handleUserInteraction, { passive: true });
    el.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    el.addEventListener('keydown', handleUserInteraction, { passive: true });

    const handleScroll = () => {
      // Never record scroll position while programmatic restoration is in progress
      if (isRestoringRef.current) return;

      const currentScroll = el.scrollTop;
      const currentPath = locationPathRef.current;
      scrollPositions[currentPath] = currentScroll;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('wheel', handleUserInteraction);
      el.removeEventListener('touchstart', handleUserInteraction);
      el.removeEventListener('touchmove', handleUserInteraction);
      el.removeEventListener('pointerdown', handleUserInteraction);
      el.removeEventListener('keydown', handleUserInteraction);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  // 2. Route Transition Handler & Intelligent Multi-Frame Restoration
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targetPath = location.pathname;
    const targetScroll = scrollPositions[targetPath] || 0;
    targetScrollRef.current = targetScroll;

    // Clear any pending restoration timers
    if (restoreFrameRef.current) {
      cancelAnimationFrame(restoreFrameRef.current);
      restoreFrameRef.current = null;
    }
    if (restoreTimeoutRef.current) {
      clearTimeout(restoreTimeoutRef.current);
      restoreTimeoutRef.current = null;
    }

    if (targetScroll === 0) {
      // New page or top-level navigation: reset scroll to top
      isRestoringRef.current = true;
      el.scrollTop = 0;
      requestAnimationFrame(() => {
        if (containerRef.current) containerRef.current.scrollTop = 0;
        isRestoringRef.current = false;
      });
      return;
    }

    // Returning to a previously scrolled route: lock scroll recording and restore
    isRestoringRef.current = true;

    const startTime = Date.now();
    const maxDuration = 3500; // Poll for up to 3.5s while async database cards render into DOM

    const attemptRestore = () => {
      const container = containerRef.current;
      if (!container || !isRestoringRef.current) return;

      const target = targetScrollRef.current;
      container.scrollTop = target;

      // Check if container has reached the target scroll offset
      if (Math.abs(container.scrollTop - target) <= 5) {
        // Target reached successfully!
        isRestoringRef.current = false;
        return;
      }

      // If page height hasn't expanded yet (data still loading), keep trying on next animation frames
      if (Date.now() - startTime < maxDuration) {
        restoreFrameRef.current = requestAnimationFrame(attemptRestore);
      } else {
        // Timed out: unlock scroll recording
        isRestoringRef.current = false;
      }
    };

    // Execute initial attempts
    attemptRestore();
    restoreFrameRef.current = requestAnimationFrame(attemptRestore);

    // MutationObserver watches for async DOM elements (e.g. firearm cards, ammo lists) being added
    const observer = new MutationObserver(() => {
      if (isRestoringRef.current && containerRef.current) {
        attemptRestore();
      }
    });

    observer.observe(el, { childList: true, subtree: true });

    // Safety timeout to disconnect observer after 3.6s
    restoreTimeoutRef.current = window.setTimeout(() => {
      isRestoringRef.current = false;
      observer.disconnect();
    }, 3600);

    return () => {
      observer.disconnect();
      if (restoreFrameRef.current) {
        cancelAnimationFrame(restoreFrameRef.current);
      }
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
    };
  }, [location.pathname, containerRef]);
}
