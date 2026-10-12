// Per-account branding for the share page: the operator's logo, and the
// background behind the photos. Set by the account owner in the platform's
// Preferences → Branding tab and read here by the folder in our own URL.
//
// This is what replaces hand-built per-customer templates (`/visa`, `/grammy`)
// for the ordinary case: one `/photoshare` page that wears whichever brand the
// folder belongs to.

/**
 * The look of an unbranded page — black, no logo override.
 *
 * Must stay identical to the platform's `DEFAULT_BACKGROUND_COLOUR`, and both
 * must match what `PhotoSharePage` renders without branding. An account that
 * never opened the branding tab has to look exactly as it did before this
 * existed; a mismatch here repaints every one of them.
 */
export const DEFAULT_BRANDING = Object.freeze({
  logo: null,
  // The heading is part of the page today, so an account that has set nothing
  // keeps it.
  showHeading: true,
  // `null` means the stock sentence below, which is what every account that
  // has not written its own gets.
  expiryMessage: null,
  background: Object.freeze({ kind: "colour", url: null, colour: "#000000" }),
  // Each of these is what `PhotoSharePage` hard-codes today: `#fff` body text,
  // the `ACCENT` button fill, black words on it. They have to match, because
  // these are what every unbranded account is served.
  colours: Object.freeze({
    text: "#FFFFFF",
    button: "#D4FF3D",
    buttonLabel: "#000000",
  }),
});

/**
 * Give up quickly. Branding is decoration on a page whose job is to show
 * somebody their photos — waiting on it is worse than not having it, and the
 * photos are fetched in parallel anyway.
 */
const TIMEOUT_MS = 2500;

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Mirrors `MAX_EXPIRY_MESSAGE_LENGTH` on the platform. Capped again here
 * because this page cannot scroll — it is one locked viewport — so an
 * over-long message would push the footer off the bottom rather than wrap.
 */
const MAX_EXPIRY_MESSAGE_LENGTH = 500;

/**
 * The stock expiry sentence.
 *
 * Must stay word for word identical to `DEFAULT_EXPIRY_MESSAGE` on the
 * platform, which shows it as the placeholder an operator is replacing. A
 * placeholder promising different wording than the page renders would be worse
 * than no placeholder at all.
 */
export const DEFAULT_EXPIRY_MESSAGE =
  "These photos were available for a limited time after your session and have now been removed. Anything you already saved stays on your device.";

/**
 * An http(s) URL, or null.
 *
 * The response is trusted-ish — it comes from our own platform — but it lands
 * in a `src` and a `url()`, so a `javascript:` or `data:` value is refused here
 * rather than relied on being impossible upstream. Costs one check.
 */
function safeUrl(value) {
  if (typeof value !== "string" || value === "") return null;
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * A validated URL wrapped for a CSS `background-image`.
 *
 * `CSS.escape` is the wrong tool here — it escapes identifiers, not URL
 * strings, and would mangle the scheme and slashes. What actually matters
 * inside `url("...")` is that the string cannot be closed early, and `safeUrl`
 * has already run the value through the URL parser, which percent-encodes
 * quotes and whitespace. The two replacements below are belt and braces.
 */
export function cssUrl(url) {
  const escaped = String(url).replace(/\\/g, "%5C").replace(/"/g, "%22");
  return `url("${escaped}")`;
}

/** A `#RRGGBB` string, or `fallback`. Every colour on the page goes through it. */
function safeColour(value, fallback) {
  return HEX.test(value) ? value : fallback;
}

/**
 * The operator's expiry wording, or `null` for the stock sentence.
 *
 * Plain text either way. It is rendered as a React text node, never as markup,
 * so there is nothing here to sanitise — only a length to hold to and a blank
 * to treat as "not set".
 */
function safeExpiryMessage(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_EXPIRY_MESSAGE_LENGTH);
}

function safeImage(value) {
  const url = safeUrl(value?.url);
  if (!url) return null;
  const width = Number(value?.width);
  const height = Number(value?.height);
  return {
    url,
    width: Number.isFinite(width) && width > 0 ? width : null,
    height: Number.isFinite(height) && height > 0 ? height : null,
  };
}

/**
 * Coerce whatever came back into something safe to render.
 *
 * Every field falls back on its own: a payload with a good logo and a nonsense
 * colour should still show the logo. Nothing here throws.
 */
export function normaliseBranding(payload) {
  const branding = payload?.data?.branding ?? payload?.branding ?? null;
  if (!branding || typeof branding !== "object") return DEFAULT_BRANDING;

  const background = branding.background ?? {};
  const colour = safeColour(background.colour, DEFAULT_BRANDING.background.colour);
  const imageUrl = background.kind === "image" ? safeUrl(background.url) : null;

  const colours = branding.colours ?? {};

  return {
    logo: safeImage(branding.logo),
    // Only an explicit `false` hides it — a platform that does not send the
    // field yet, or sends something odd, leaves the heading where it is.
    showHeading: branding.showHeading !== false,
    expiryMessage: safeExpiryMessage(branding.expiryMessage),
    background: {
      // The colour wins when the image is missing or unusable, so the page
      // always has something to paint. Mirrors `resolveBackground` on the
      // platform, which makes the same call one layer earlier.
      kind: imageUrl ? "image" : "colour",
      url: imageUrl,
      colour,
    },
    // Field by field, like everything else here: a payload from a platform that
    // does not send `colours` yet, or that sends one bad value, still styles
    // the rest of the page rather than falling back wholesale.
    colours: {
      text: safeColour(colours.text, DEFAULT_BRANDING.colours.text),
      button: safeColour(colours.button, DEFAULT_BRANDING.colours.button),
      buttonLabel: safeColour(
        colours.buttonLabel,
        DEFAULT_BRANDING.colours.buttonLabel,
      ),
    },
  };
}

/**
 * Fetch the branding for a share folder.
 *
 * Never rejects and never throws: an unreachable platform, a timeout, a 500 or
 * a body that is not what we expect all resolve to {@link DEFAULT_BRANDING},
 * which is the page exactly as it looked before this feature. A guest opening
 * their photos must never see a failure that belongs to a logo.
 *
 * @param {string} folder - the `shortUUID` route param
 * @returns {Promise<typeof DEFAULT_BRANDING>}
 */
export async function fetchBranding(folder) {
  const base = import.meta.env.VITE_PLATFORM_URL;
  if (!base || !folder) return DEFAULT_BRANDING;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${String(base).replace(/\/+$/, "")}/api/v1/public/photoshare/branding?folder=${encodeURIComponent(folder)}`;
    // Deliberately no credentials: the endpoint serves
    // `Access-Control-Allow-Origin: *`, which a browser refuses to expose to a
    // credentialed request.
    const res = await fetch(url, { signal: controller.signal, credentials: "omit" });
    if (!res.ok) return DEFAULT_BRANDING;
    return normaliseBranding(await res.json());
  } catch {
    // Includes the abort. Silent on purpose — there is nothing a guest or an
    // operator can do about it, and the page is already correct without it.
    return DEFAULT_BRANDING;
  } finally {
    clearTimeout(timer);
  }
}
