// Loading an image before anything on screen points at it.
//
// The share page swaps its default logo and background for an account's own
// once branding arrives. Pointing an `<img>` at a URL that has not downloaded
// yet swaps a drawn logo for an empty box, and a CSS `background-image` paints
// the moment it lands, mid-scroll if that is when it finishes. Both read as a
// glitch on a page a guest opened to look at their photos.
//
// So nothing is applied until it is ready to paint. The page shows in its own
// colours immediately, and the brand appears in one step afterwards.

/**
 * Long enough for a large background on a venue's wifi, short enough that a
 * dead URL does not keep a promise pending for the life of the page.
 */
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Resolve once `url` is downloaded and decoded, or `false` if it is not usable.
 *
 * Never rejects. A 404, a network drop, a file that is not really an image, and
 * a timeout are all the same answer to the caller: do not use this. The page
 * then keeps whatever it was already showing.
 *
 * `decode()` is what makes this worth doing over a plain `onload`: it waits for
 * the bitmap to be ready to paint, not merely for the bytes to arrive, so the
 * first frame after the swap is the finished image. Browsers that lack it, or
 * throw from it, fall back to the load event.
 *
 * @param {string} url
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export function preloadImage(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (!url) return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };

    const timer = setTimeout(() => {
      // The download is left to finish into the browser cache — cancelling it
      // would only mean paying for it again if the page asks later.
      finish(false);
    }, timeoutMs);

    img.onload = () => {
      if (typeof img.decode !== "function") return finish(true);
      img.decode().then(
        () => finish(true),
        // Decoding can fail on a file that loaded — a truncated or corrupt
        // image. It arrived, but it cannot be drawn, which is a refusal.
        () => finish(false),
      );
    };
    img.onerror = () => finish(false);

    // Assigned last so a cached image cannot fire `onload` before the handlers
    // are attached.
    img.src = url;
  });
}
