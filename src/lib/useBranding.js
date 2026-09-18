import { useEffect, useState } from "react";
import { DEFAULT_BRANDING, fetchBranding } from "./branding";

/**
 * The branding for a share folder, starting from the unbranded defaults.
 *
 * Starts at {@link DEFAULT_BRANDING} rather than at a loading state on
 * purpose: the page renders immediately in its normal black, and a custom
 * brand replaces it when it arrives. The alternative — holding the page back
 * until branding lands — would put a spinner in front of a guest's photos for
 * the sake of a logo.
 *
 * @param {string} folder - the `shortUUID` route param
 */
export function useBranding(folder) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    let cancelled = false;
    fetchBranding(folder).then((next) => {
      if (!cancelled) setBranding(next);
    });
    return () => {
      cancelled = true;
    };
  }, [folder]);

  return branding;
}
