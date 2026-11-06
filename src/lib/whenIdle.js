// Running work once the browser has nothing more pressing to do.

/**
 * How long to wait before running anyway.
 *
 * `requestIdleCallback` can be starved indefinitely on a busy page, and on this
 * one the busy work is the photo fetch — exactly the thing being yielded to. A
 * deadline means branding is late rather than never.
 */
const IDLE_TIMEOUT_MS = 2000;

/**
 * The wait where `requestIdleCallback` is missing — Safari only got it in 16.4,
 * and event traffic is mostly phones.
 *
 * Not zero: a zero timeout runs on the next tick, which is still inside the
 * burst this is meant to yield to, and would leave those browsers with the
 * behaviour this change exists to fix. Long enough for the first paint and for
 * the media request to be in flight, short enough that nobody reads it as the
 * brand failing to load.
 */
const FALLBACK_DELAY_MS = 200;

/**
 * Schedule `callback` for the browser's next idle period.
 *
 * Used for the branding request, which competes with the media fetch that the
 * guest actually opened the page for. Yielding costs a fraction of a second on
 * a logo and leaves the connection to the photos.
 *
 * Where `requestIdleCallback` is missing it falls back to a short timeout, so
 * the deferral still happens — see `FALLBACK_DELAY_MS`.
 *
 * @param {() => void} callback
 * @returns {() => void} cancels the scheduled run
 */
export function whenIdle(callback) {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = setTimeout(callback, FALLBACK_DELAY_MS);
  return () => clearTimeout(handle);
}
