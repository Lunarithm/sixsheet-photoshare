import { useState, useEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Box, Container, Button, Typography, GlobalStyles } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "../assets/theme";
import "../index.css";
import { useParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { fetchMediaWithRetry, unregisterStaleServiceWorkers } from "../lib/fetchMedia";
import QRCode from "react-qr-code";
import "../assets/font.css";
import "../assets/css/photoShare.css";
// Top-center logo icon — swap this file (or change the path) to change the icon.
import capturesIcon from "../assets/iconCap.png";

const ACCENT = "#D4FF3D";
// QR caption ("Scan to download / or print") — Neulis Neue per the design.
// Face is declared in src/assets/font.css.
const QR_CAPTION_FONT = '"Neulis Neue", "Inter", "Helvetica Neue", Arial, sans-serif';
// Shared style for the two recovery buttons in the error states — same
// language as the DOWNLOAD button, one size down.
const RETRY_BUTTON_SX = {
  mt: "clamp(10px, 2vmin, 18px)",
  px: "clamp(16px, 3vmin, 28px)",
  height: "clamp(30px, 4.8vmin, 42px)",
  borderRadius: "clamp(3px, 0.6vmin, 6px)",
  bgcolor: ACCENT,
  color: "#000",
  fontWeight: 800,
  fontSize: "clamp(0.7rem, 1.6vmin, 0.9rem)",
  letterSpacing: "0.06em",
  fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
  textTransform: "none",
  boxShadow: "none",
  "&:hover": { bgcolor: ACCENT, boxShadow: "none", filter: "brightness(0.95)" },
};

// Safari intermittently drops an S3 image fetch on a cold connection. Retry a
// few times with backoff and a cache-busting param instead of leaving a broken
// image on screen. Returns an onError handler bound to the source URL.
const retryImageOnError = (src) => (e) => {
  const el = e.currentTarget;
  const attempt = Number(el.dataset.retry || 0);
  const backoff = [500, 1500, 3500];
  if (!src || attempt >= backoff.length) return;
  el.dataset.retry = String(attempt + 1);
  setTimeout(() => {
    const sep = src.includes("?") ? "&" : "?";
    el.src = `${src}${sep}r=${Date.now()}.${attempt + 1}`;
  }, backoff[attempt]);
};

const TYPES = [
  { key: "PRINT", label: "PRINT", mediaLabel: "Photo" },
  { key: "LIVE_PHOTO", label: "LIVE PHOTO", mediaLabel: "Video" },
  { key: "GIF", label: "GIF", mediaLabel: "Slideshow" },
];

function QrGlyph({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <g fill="#fff">
        <rect x="2" y="2" width="8" height="8" rx="1.5" />
        <rect x="4" y="4" width="4" height="4" fill="#000" />
        <rect x="14" y="2" width="8" height="8" rx="1.5" />
        <rect x="16" y="4" width="4" height="4" fill="#000" />
        <rect x="2" y="14" width="8" height="8" rx="1.5" />
        <rect x="4" y="16" width="4" height="4" fill="#000" />
        <rect x="13" y="13" width="3" height="3" />
        <rect x="18" y="13" width="4" height="3" />
        <rect x="13" y="18" width="3" height="4" />
        <rect x="18" y="18" width="4" height="4" />
      </g>
    </svg>
  );
}

function PhotoSharePage() {
  const { shortUUID } = useParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedType, setSelectedType] = useState("LIVE_PHOTO");
  const [showQr, setShowQr] = useState(false);
  // Paths of videos this browser could not play, so the still frame takes over.
  const [failedVideos, setFailedVideos] = useState({});
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const MAX_AUTO_RETRIES = 12;
  const RETRY_INTERVAL_SEC = 10;

  const getMediaType = (name) => {
    if (name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov")) return "video";
    return "image";
  };

  const getLabel = (name) => {
    if (name.startsWith("slideshow")) return "Slideshow";
    if (name.startsWith("video_Result")) return "Video";
    return "Photo";
  };

  async function convertUrlToFile(url, name) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
      const blob = await response.blob();
      const ext = name.split(".").pop();
      const mimeType =
        ext === "mp4" ? "video/mp4"
        : ext === "webm" ? "video/webm"
        : ext === "png" ? "image/png"
        : "image/jpeg";
      return new File([blob], name, { type: mimeType });
    } catch (err) {
      console.error("convertUrlToFile failed:", err);
      return null;
    }
  }

  const fetchData = async () => {
    setLoadError(false);
    setErrorDetail("");
    await unregisterStaleServiceWorkers();
    try {
      const { source } = await fetchMediaWithRetry(
        import.meta.env.VITE_APIHUB_URL,
        shortUUID
      );

      const thumbMap = {};
      for (const s of source) {
        if (s.name.endsWith("_thumb.jpg")) {
          const baseName = s.name.replace("_thumb.jpg", "");
          thumbMap[baseName] = s.path;
        }
      }

      const displaySource = source.filter((s) => !s.name.endsWith("_thumb.jpg"));
      const imageItem = displaySource.find((s) => /\.(jpe?g|png|webp)$/i.test(s.name));
      const imageOnlyFallback = imageItem?.path || "";

      const items = displaySource.map((item) => {
        const type = getMediaType(item.name);
        const baseName = item.name.replace(/\.[^.]+$/, "");
        const thumbnail =
          type === "video" ? thumbMap[baseName] || imageOnlyFallback : item.path;
        return {
          name: item.name,
          path: item.path,
          type,
          label: getLabel(item.name),
          thumbnail,
          file: null,
        };
      });

      setMediaItems(items);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load media:", error, error?.diagnostics);
      setLoadError(true);
      const diag = Array.isArray(error?.diagnostics)
        ? error.diagnostics
            .map(
              (d) =>
                `#${d.attempt}/${d.via}: ${d.kind}${d.status ? ` [${d.status}]` : ""}${d.contentType ? ` ${d.contentType}` : ""}${d.message ? ` — ${d.message}` : ""}`
            )
            .join("\n")
        : error?.message || "Unknown error";
      setErrorDetail(diag);
      setLoading(false);
    }
  };

  useEffect(() => {
    setAutoRetryCount(0);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortUUID]);

  useEffect(() => {
    if (!loadError || autoRetryCount >= MAX_AUTO_RETRIES) return;
    setRetryCountdown(RETRY_INTERVAL_SEC);
    const tickId = setInterval(() => {
      setRetryCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    const retryId = setTimeout(() => {
      setAutoRetryCount((n) => n + 1);
      setLoading(true);
      fetchData();
    }, RETRY_INTERVAL_SEC * 1000);
    return () => {
      clearInterval(tickId);
      clearTimeout(retryId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError, autoRetryCount]);

  // Once the media list arrives, snap the default selection to whatever
  // is actually available — prefer LIVE PHOTO, else fall back in order.
  useEffect(() => {
    if (!mediaItems.length) return;
    const availableKeys = TYPES
      .filter((t) => mediaItems.some((m) => m.label === t.mediaLabel))
      .map((t) => t.key);
    if (availableKeys.length && !availableKeys.includes(selectedType)) {
      setSelectedType(availableKeys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaItems]);

  // All items of the selected type (a print session can produce 2+ frames).
  const currentItems = useMemo(() => {
    const mediaLabel = TYPES.find((t) => t.key === selectedType)?.mediaLabel;
    return mediaItems.filter((m) => m.label === mediaLabel);
  }, [mediaItems, selectedType]);

  // Which frame set is showing. Deliberately NOT reset when the user switches
  // type (PRINT/LIVE PHOTO/GIF) or when items update (e.g. a file finishes
  // caching after download) — set 2 stays selected until the user clicks
  // set 1 themselves. Reset only when a new share session (shortUUID) loads.
  const [mediaIndex, setMediaIndex] = useState(0);
  useEffect(() => {
    setMediaIndex(0);
  }, [shortUUID]);

  // Clamp for types that have fewer frames than the selected index —
  // display-wise it falls back to that type's last frame without losing
  // the user's chosen set for types that do have it.
  const safeIndex = Math.min(mediaIndex, Math.max(currentItems.length - 1, 0));
  const currentMedia = currentItems[safeIndex] || null;

  // Still frame for the current item: the file itself for photos, the
  // *_thumb.jpg poster frame for videos. Never a video URL — Safari will not
  // render one in an <img>. Empty only when a session ships a video with
  // neither a thumb nor a photo alongside it.
  const currentStill = currentMedia
    ? currentMedia.type === "video"
      ? currentMedia.thumbnail
      : currentMedia.path
    : "";
  const videoUnplayable = !!currentMedia && !!failedVideos[currentMedia.path];


  const availableKeys = useMemo(
    () => TYPES.filter((t) => mediaItems.some((m) => m.label === t.mediaLabel)).map((t) => t.key),
    [mediaItems]
  );

  // Manual counterpart to the auto-retry timer. Bumping autoRetryCount also
  // restarts that timer, so a manual check never leaves two polls in flight.
  const checkNow = () => {
    setAutoRetryCount((n) => n + 1);
    setLoading(true);
    fetchData();
  };

  const getFile = async (item) => {
    if (!item) return null;
    if (item.file) return item.file;
    const file = await convertUrlToFile(item.path, item.name);
    setMediaItems((prev) => prev.map((m) => (m.name === item.name ? { ...m, file } : m)));
    return file;
  };

  // Labeled DOWNLOAD, but identical to the old share button: opens the
  // native share sheet with the file. No download fallback — browsers
  // without Web Share (most desktop) simply do nothing, same as before.
  const handleDownload = async () => {
    if (!currentMedia || !navigator.share) return;
    try {
      const file = await getFile(currentMedia);
      if (file) await navigator.share({ files: [file] });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {/*
        Layout goal: whole page must fit in a single viewport, no scrollbars
        at any device size, with the proportions of every element preserved.

        Strategy:
          • Container is height: 100dvh + overflow: hidden. `dvh` handles
            mobile browser chrome (Safari URL bar) so we never overflow.
          • Fixed-height elements (logo, title, pills, buttons, footer) use
            clamp() based on vmin so they scale evenly with whichever axis
            is smaller — this keeps proportions on portrait phones AND
            landscape / desktop without distortion.
          • The media preview is the ONLY flexible piece — flex:1 min-height:0
            plus object-fit: contain lets the image/video fill whatever
            vertical space is left over while keeping its own aspect ratio.
          • Body/html get overflow:hidden to guarantee no scrollbar at all.
      */}
      <GlobalStyles styles={{ "html, body, #root": { overflow: "hidden", margin: 0, height: "100%" } }} />
      <Container
        maxWidth={false}
        disableGutters
        component="main"
        sx={{
          height: "100dvh",
          maxHeight: "100dvh",
          width: "100vw",
          maxWidth: "100vw",
          overflow: "hidden",
          bgcolor: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          px: "clamp(12px, 3vmin, 32px)",
          py: "clamp(12px, 2.5vmin, 28px)",
          boxSizing: "border-box",
        }}
      >
        {/* Inner column: caps width for desktop, flex column so preview grows. */}
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "min(480px, 92vw)", sm: "min(1000px, 94vw)" },
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(14px, 3vmin, 28px)",
          }}
        >
          {/* Logo — image imported from src/assets/captures-icon.svg; replace
              that file to change the icon (hard-reload after swapping).
              Desktop adds the CAPTURES wordmark next to the icon. */}
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              // Mobile: double spacing (gap + this mb = 2x the normal gap).
              // PC: match the spacing below the title (1.2 units total),
              // so the title sits evenly between logo and content.
              mb: { xs: "clamp(14px, 3vmin, 28px)", sm: "clamp(3px, 0.6vmin, 6px)" },
            }}
          >
            <Box
              component="img"
              src={capturesIcon}
              alt=""
              sx={{
                width: { xs: "clamp(48px, 9vmin, 84px)", sm: "clamp(36px, 4.8vmin, 48px)" },
                height: { xs: "clamp(48px, 9vmin, 84px)", sm: "clamp(36px, 4.8vmin, 48px)" },
                display: "block",
                objectFit: "contain",
              }}
            />
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                color: ACCENT,
                fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                fontWeight: 800,
                fontSize: "clamp(1rem, 2.2vmin, 1.35rem)",
                letterSpacing: "0.08em",
              }}
            >
              CAPTURES
            </Typography>
          </Box>

          {/* Title */}
          <Typography
            sx={{
              flexShrink: 0,
              color: "#fff",
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
              fontWeight: 700,
              fontSize: "clamp(1.05rem, 3.2vmin, 1.9rem)",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              // Title → preview spacing is 1.2x the normal gap
              // (was 1.5x, then reduced 20%).
              mb: "clamp(3px, 0.6vmin, 6px)",
            }}
          >
            Download Your Files
          </Typography>

          {/* Content area — single column on mobile; on desktop a two-column
              row: media + buttons on the left, an always-visible QR on the right. */}
          <Box
            sx={{
              flex: "0 1 auto",
              minHeight: 0,
              width: "100%",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: "clamp(14px, 3vmin, 28px)", sm: "clamp(48px, 10vmin, 140px)" },
            }}
          >
          {/* Left column: preview + pills + download */}
          <Box
            sx={{
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: { xs: "100%", sm: "auto" },
            }}
          >
          {/* Media preview — sized to content (capped at ~70% of what it could
              fill) so the buttons below sit right under it; the leftover space
              collects above the footer via its mt:auto. Still shrinks first if
              the viewport is short, and the media keeps its own aspect ratio. */}
          <Box
            sx={{
              flex: "0 1 auto",
              minHeight: 0,
              width: { xs: "77%", sm: "auto" },
              // PC preview scales fluidly with the viewport (like mobile) —
              // no fixed px cap; the media itself caps its height in dvh so
              // portrait strips scale down whole, never cropped.
              maxWidth: { sm: "32.5vw" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <ClipLoader color={ACCENT} loading size={48} />
            ) : loadError || !currentMedia ? (
              <Box
                sx={{
                  px: 2,
                  textAlign: "center",
                  // The page is one locked viewport with no scrollbar, so this
                  // state must never grow past the media it stands in for —
                  // diagnostics scroll inside the box instead of pushing the
                  // footer off screen.
                  maxHeight: { xs: "53.9dvh", sm: "47.9dvh" },
                  overflowY: "auto",
                }}
              >
                {autoRetryCount < MAX_AUTO_RETRIES ? (
                  <>
                    <ClipLoader color={ACCENT} loading size={36} />
                    <Typography sx={{ color: "#fff", fontSize: "clamp(0.75rem, 1.8vmin, 1rem)", mt: "8px", opacity: 0.9 }}>
                      Your photos are still being uploaded.
                    </Typography>
                    <Typography sx={{ color: "#fff", fontSize: "clamp(0.7rem, 1.6vmin, 0.9rem)", opacity: 0.65, mt: "4px" }}>
                      Retrying in {retryCountdown}s.
                    </Typography>
                    {/* Skips the wait for a guest who knows the upload just
                        finished — the countdown alone gives them nothing to do. */}
                    <Button onClick={checkNow} disableRipple sx={RETRY_BUTTON_SX}>
                      Check Now
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography sx={{ color: "#fff", fontSize: "clamp(0.85rem, 2vmin, 1.05rem)", fontWeight: 600 }}>
                      Media not found
                    </Typography>
                    <Typography sx={{ color: "#fff", fontSize: "clamp(0.7rem, 1.6vmin, 0.9rem)", opacity: 0.7, mt: "6px" }}>
                      This share link may have expired.
                    </Typography>
                    <Button onClick={() => window.location.reload()} disableRipple sx={RETRY_BUTTON_SX}>
                      Try Again
                    </Button>
                    {/* Per-attempt transport/status detail. Deliberately on
                        screen, not just in the console: this is what a guest can
                        actually screenshot for us when a link will not load. */}
                    {errorDetail && (
                      <Box
                        component="pre"
                        sx={{
                          mt: "clamp(10px, 2vmin, 16px)",
                          mx: "auto",
                          maxWidth: "min(90vw, 520px)",
                          fontSize: "clamp(0.55rem, 1.2vmin, 0.7rem)",
                          lineHeight: 1.5,
                          color: "#fff",
                          opacity: 0.55,
                          textAlign: "left",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {errorDetail}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            ) : (
              // Relative wrapper so the frame counter can sit on top of the
              // media. Frames are switched with the numbered buttons below.
              <Box sx={{ position: "relative", display: "flex" }}>
                {currentMedia.type === "video" && !videoUnplayable ? (
                  <Box
                    component="video"
                    key={currentMedia.path}
                    src={currentMedia.path}
                    // Painted until the first frame decodes — and left standing
                    // on devices whose decoder rejects the file outright (iOS
                    // refuses H.264 above its 4K / level ceiling, for one),
                    // which otherwise leaves an empty 300x150 default-sized box.
                    poster={currentStill || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onError={(e) => {
                      console.error("Video error:", currentMedia.path, e?.currentTarget?.error);
                      setFailedVideos((prev) => ({ ...prev, [currentMedia.path]: true }));
                    }}
                    sx={{
                      // The media caps its own height in viewport units (not a %
                      // of an indefinite flex parent) so a portrait strip scales
                      // down whole instead of getting cropped by overflow.
                      maxWidth: "100%",
                      maxHeight: { xs: "53.9dvh", sm: "47.9dvh" },
                      width: "auto",
                      height: "auto",
                      display: "block",
                      objectFit: "contain",
                    }}
                  />
                ) : currentStill ? (
                  // Stills, and the fallback for a video this browser refused.
                  <Box
                    component="img"
                    key={currentStill}
                    src={currentStill}
                    alt={currentMedia.label}
                    loading="lazy"
                    decoding="async"
                    onError={retryImageOnError(currentStill)}
                    sx={{
                      maxWidth: "100%",
                      maxHeight: { xs: "53.9dvh", sm: "47.9dvh" },
                      width: "auto",
                      height: "auto",
                      display: "block",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  // Video the browser cannot play, with no thumb to fall back
                  // on. Rare, but better named than left as an empty box.
                  <Typography
                    sx={{
                      color: "#fff",
                      opacity: 0.7,
                      px: 3,
                      py: 6,
                      textAlign: "center",
                      fontSize: "clamp(0.7rem, 1.6vmin, 0.9rem)",
                      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                    }}
                  >
                    This clip can&apos;t be played on this device.
                    <br />
                    Use DOWNLOAD to save it.
                  </Typography>
                )}

                {/* Frame counter — top-left (1/2, 2/2; 1/1 when single) */}
                <Box
                  sx={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    bgcolor: "rgba(0,0,0,0.65)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "clamp(0.7rem, 1.6vmin, 0.85rem)",
                    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                    px: "10px",
                    py: "3px",
                    borderRadius: "999px",
                    pointerEvents: "none",
                  }}
                >
                  {safeIndex + 1}/{currentItems.length}
                </Box>

              </Box>
            )}
          </Box>

          {/* Frame toggle — switches between frame set 1 / 2 when the
              selected type has more than one file */}
          {currentItems.length > 1 && (
            <Box
              sx={{
                flexShrink: 0,
                display: "flex",
                gap: "clamp(6px, 1.2vmin, 12px)",
                justifyContent: "center",
                mt: "clamp(8px, 1.6vmin, 14px)",
              }}
            >
              {currentItems.map((_, i) => (
                <Button
                  key={i}
                  onClick={() => setMediaIndex(i)}
                  disableRipple
                  sx={{
                    minWidth: 0,
                    width: "clamp(30px, 4.8vmin, 40px)",
                    height: "clamp(30px, 4.8vmin, 40px)",
                    borderRadius: "50%",
                    bgcolor: safeIndex === i ? ACCENT : "#fff",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "clamp(0.7rem, 1.6vmin, 0.9rem)",
                    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                    boxShadow: "none",
                    "&:hover": { bgcolor: safeIndex === i ? ACCENT : "#f0f0f0", boxShadow: "none" },
                  }}
                >
                  {i + 1}
                </Button>
              ))}
            </Box>
          )}

          {/* Type filter pills */}
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              gap: "clamp(6px, 1.2vmin, 12px)",
              flexWrap: "wrap",
              justifyContent: "center",
              // Mobile: match the title → preview spacing (outer column gap
              // + 0.2 unit = 1.2x gap) so the space above and below the image
              // is equal — the left column has no flex gap of its own, so the
              // full 1.2 units must come from this margin. PC keeps 1.5x.
              mt: { xs: "clamp(22.4px, 4.75vmin, 44.9px)", sm: "clamp(10.2px, 2.18vmin, 20.3px)" },
            }}
          >
            {TYPES.map((t) => {
              const active = selectedType === t.key;
              const enabled = availableKeys.length === 0 || availableKeys.includes(t.key);
              return (
                <Button
                  key={t.key}
                  onClick={() => enabled && setSelectedType(t.key)}
                  disableRipple
                  sx={{
                    minWidth: 0,
                    px: "clamp(14px, 2.6vmin, 26px)",
                    height: "clamp(28px, 4.5vmin, 40px)",
                    borderRadius: "999px",
                    bgcolor: active ? ACCENT : "#fff",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "clamp(0.65rem, 1.5vmin, 0.85rem)",
                    letterSpacing: "0.04em",
                    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                    textTransform: "none",
                    boxShadow: "none",
                    opacity: enabled ? 1 : 0.35,
                    cursor: enabled ? "pointer" : "not-allowed",
                    "&:hover": { bgcolor: active ? ACCENT : "#f0f0f0", boxShadow: "none" },
                  }}
                >
                  {t.label}
                </Button>
              );
            })}
          </Box>

          {/* Download button */}
          <Button
            onClick={handleDownload}
            disabled={!currentMedia}
            disableRipple
            sx={{
              flexShrink: 0,
              // Mobile: same 1.2-unit spacing as around the image (the left
              // column has no flex gap, so the margin carries it all).
              mt: { xs: "clamp(22.4px, 4.75vmin, 44.9px)", sm: "clamp(10.2px, 2.18vmin, 20.3px)" },
              width: "100%",
              maxWidth: "clamp(150px, 28.7vmin, 218px)",
              height: { xs: "clamp(40px, 6.6vmin, 60px)", sm: "clamp(36px, 6vmin, 55px)" },
              borderRadius: "clamp(3px, 0.6vmin, 6px)",
              bgcolor: ACCENT,
              color: "#000",
              fontWeight: 800,
              fontSize: "clamp(0.8rem, 1.9vmin, 1.05rem)",
              letterSpacing: "0.06em",
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { bgcolor: ACCENT, boxShadow: "none", filter: "brightness(0.95)" },
              "&.Mui-disabled": { bgcolor: ACCENT, color: "#000", opacity: 0.4 },
            }}
          >
            DOWNLOAD
            <Box component="span" sx={{ ml: "10px", fontSize: "clamp(0.95rem, 2.2vmin, 1.3rem)", lineHeight: 1 }}>→</Box>
          </Button>
          </Box>

          {/* Right column (desktop only): always-visible QR */}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(14px, 2.5vmin, 24px)",
            }}
          >
            <Box
              sx={{
                bgcolor: "#fff",
                p: "clamp(10px, 1.6vmin, 16px)",
                borderRadius: "4px",
                display: "flex",
              }}
            >
              <QRCode
                value={window.location.href}
                style={{ width: "clamp(150px, 24vmin, 220px)", height: "auto" }}
              />
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 600,
                fontSize: "clamp(0.85rem, 1.9vmin, 1.1rem)",
                fontFamily: QR_CAPTION_FONT,
                lineHeight: 1.4,
              }}
            >
              Scan to download
              <br />
              or print
            </Typography>
          </Box>
          </Box>

          {/* Show QR — mobile only; desktop shows the QR inline instead */}
          <Button
            onClick={() => setShowQr(true)}
            disableRipple
            sx={{
              display: { xs: "inline-flex", sm: "none" },
              flexShrink: 0,
              // Mobile-only element. It sits in the outer column, which already
              // adds one gap unit — this mt tops it up to the same 1.2 units
              // used everywhere else in the button zone.
              mt: "clamp(3px, 0.6vmin, 6px)",
              bgcolor: "transparent",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "clamp(0.75rem, 1.7vmin, 0.95rem)",
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
              gap: "8px",
              "&:hover": { bgcolor: "transparent" },
            }}
          >
            <Box sx={{ display: "flex", width: "clamp(16px, 2.6vmin, 24px)", height: "clamp(16px, 2.6vmin, 24px)" }}>
              <QrGlyph size="100%" />
            </Box>
            Show QR
          </Button>

          {/* Footer */}
          <Box sx={{ flexShrink: 0, mt: "auto" }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "clamp(0.6rem, 1.4vmin, 0.78rem)",
                letterSpacing: "0.08em",
                fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              © SIXSHEET GROUP. ALL RIGHT RESERVED
            </Typography>
          </Box>
        </Box>

        {/* QR popup (mobile) — bare QR over a dimmed page, caption below,
            same look as the PC inline QR panel. Tap anywhere to close. */}
        {showQr && (
          <Box
            onClick={() => setShowQr(false)}
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.75)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "18px",
              p: "20px",
            }}
          >
            <Box sx={{ bgcolor: "#fff", p: "12px", display: "flex" }}>
              <QRCode
                value={window.location.href}
                style={{ width: "min(60vw, 240px)", height: "auto" }}
              />
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 600,
                fontSize: "1.15rem",
                textAlign: "center",
                lineHeight: 1.4,
                fontFamily: QR_CAPTION_FONT,
              }}
            >
              Scan to download
              <br />
              or print
            </Typography>
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default PhotoSharePage;
