import { useEffect, useState } from "react";
import { DEFAULT_BRANDING, fetchBranding } from "./branding";
import { preloadImage } from "./preloadImage";
import { whenIdle } from "./whenIdle";

/**
 * The branding for a share folder, arriving in stages behind the page.
 *
 * Starts at {@link DEFAULT_BRANDING} rather than at a loading state: the page
 * renders immediately in its own colours, and the account's brand replaces it
 * once ready. Holding the page back would put a spinner in front of a guest's
 * photos for the sake of a logo.
 *
 * Three things keep the brand from arriving as a glitch.
 *
 * The request waits for an idle moment. The photos are what the guest came
 * for and they are fetched on mount too; branding is decoration and should not
 * compete for the connection.
 *
 * Each image is downloaded and decoded before anything points at it. Applying
 * a URL the moment the API names it would swap a drawn logo for an empty box
 * until the file arrived, and paint a background whenever it happened to land.
 *
 * And each part lands on its own. The colours need no download so they apply
 * first; a slow background does not hold up a logo that is already decoded, and
 * an image that never loads leaves the rest of the brand in place.
 *
 * @param {string} folder - the `shortUUID` route param
 * @returns {typeof DEFAULT_BRANDING}
 */
export function useBranding(folder) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    let cancelled = false;
    // Guards every state write below, not just the fetch: each image resolves
    // on its own schedule, and any of them can finish after a folder change.
    const alive = () => !cancelled;

    const cancelIdle = whenIdle(async () => {
      const next = await fetchBranding(folder);
      if (!alive()) return;

      // Colours cost nothing to draw, so they go up first and give the images
      // something to land on. `kind` stays `colour` until a background image
      // has actually decoded.
      setBranding((current) => ({
        ...current,
        background: { kind: "colour", url: null, colour: next.background.colour },
        colours: next.colours,
      }));

      if (next.logo) {
        void preloadImage(next.logo.url).then((ok) => {
          if (ok && alive()) setBranding((current) => ({ ...current, logo: next.logo }));
        });
      }

      if (next.background.kind === "image" && next.background.url) {
        void preloadImage(next.background.url).then((ok) => {
          if (ok && alive()) {
            setBranding((current) => ({ ...current, background: next.background }));
          }
        });
      }
    });

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [folder]);

  return branding;
}
