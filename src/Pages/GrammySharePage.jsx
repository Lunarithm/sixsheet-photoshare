import { useState, useEffect, useMemo, useRef } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Button, Typography } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "../assets/theme";
import { useParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { saveAs } from "file-saver";
import { fetchMediaWithRetry, unregisterStaleServiceWorkers } from "../lib/fetchMedia";
import "../index.css";
import "../assets/font.css";
import "../assets/css/grammyShare.css";

// Grammy artwork dropped into src/assets/grammy/. Matched on the file's basename
// so "photo" doesn't accidentally pick up "livephoto.png"/"photoshare_bg.png".
// import.meta.glob returns an empty map for an empty folder, so the build never
// breaks before assets are added.
const GRAMMY_ASSETS = import.meta.glob(
  "../assets/grammy/*.{png,jpg,jpeg,svg,webp}",
  { eager: true, import: "default" }
);
const basename = (p) => p.toLowerCase().split("/").pop();
const assetWhere = (pred) => {
  const entry = Object.entries(GRAMMY_ASSETS).find(([path]) => pred(basename(path)));
  return entry ? entry[1] : null;
};
const BG_ASSET = assetWhere((b) => b.includes("bg") || b.includes("background"));
const LIVEPHOTO_BTN = assetWhere((b) => b.startsWith("livephoto") || b.includes("live"));
const PHOTO_BTN = assetWhere((b) => b.startsWith("photo") && !b.includes("share") && !b.includes("bg"));

// Native portrait dimensions of the background artwork, so the frame keeps the
// baked header/footer aligned with the content overlay at any viewport size.
const BG_W = 1725;
const BG_H = 3734;

// Running-number format: "NO. MP0001". Derived deterministically from the share
// id so every visit to the same page shows the SAME unique serial. This is not a
// global sequential counter (the share pages are client-only with no backend) —
// to make it truly sequential, have the apihub assign/return a number and read
// it here instead of hashing the id.
const RUNNING_PREFIX = "MP";
const RUNNING_PAD = 4;
function runningNumber(id) {
  if (!id) return `NO. ${RUNNING_PREFIX}${"0".repeat(RUNNING_PAD)}`;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const n = (hash % 10 ** RUNNING_PAD) || 1;
  return `NO. ${RUNNING_PREFIX}${String(n).padStart(RUNNING_PAD, "0")}`;
}

// True sequential running number: used when the API payload carries one (a
// server-assigned counter). Accepts a number, a numeric string, or an already
// formatted string. Returns a display string or null when absent. This is the
// hook for a real sequential serial once the apihub assigns/stores one.
function sequentialFromApi(raw) {
  if (!raw || typeof raw !== "object") return null;
  const candidates = [
    raw.runningNumber, raw.runningNo, raw.no, raw.sequence, raw.seq,
    raw.data?.runningNumber, raw.event?.runningNumber, raw.event?.runningNo,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) {
      return `NO. ${RUNNING_PREFIX}${String(c).padStart(RUNNING_PAD, "0")}`;
    }
    if (typeof c === "string" && c.trim()) {
      const t = c.trim();
      if (/^\d+$/.test(t)) return `NO. ${RUNNING_PREFIX}${t.padStart(RUNNING_PAD, "0")}`;
      return t.toUpperCase().startsWith("NO.") ? t : `NO. ${t}`;
    }
  }
  return null;
}

/**
 * Grammy-styled share page (portrait). The background artwork bakes in the
 * header, logos and decorations; the gray middle holds the content:
 *   - a swipeable CAROUSEL between the still photo and the live photo (video),
 *     with dot indicators,
 *   - PHOTO / LIVE PHOTO buttons that share/download each one,
 *   - a unique running number ("NO. MP0001") in the bottom-right corner.
 */
function GrammySharePage() {
  const { shortUUID } = useParams();
  // Prefer a server-assigned sequential number from the API; otherwise fall
  // back to the deterministic, stable-per-page serial derived from the id.
  const [serialOverride, setSerialOverride] = useState(null);
  const serial = useMemo(
    () => serialOverride || runningNumber(shortUUID),
    [serialOverride, shortUUID]
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [photoItem, setPhotoItem] = useState(null);
  const [videoItem, setVideoItem] = useState(null);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);
  const MAX_AUTO_RETRIES = 12;
  const RETRY_INTERVAL_SEC = 10;

  const isVideo = (name) => /\.(mp4|webm|mov)$/i.test(name);

  async function convertUrlToFile(url, name) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
      const blob = await response.blob();
      const ext = name.split(".").pop().toLowerCase();
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
    await unregisterStaleServiceWorkers();
    try {
      const { source, raw } = await fetchMediaWithRetry(
        import.meta.env.VITE_APIHUB_URL,
        shortUUID
      );

      // Use a real sequential running number if the API provides one.
      setSerialOverride(sequentialFromApi(raw));

      const displaySource = source.filter((s) => !s.name.endsWith("_thumb.jpg"));
      const image = displaySource.find((s) => /\.(jpe?g|png|webp)$/i.test(s.name));
      const video = displaySource.find((s) => isVideo(s.name));

      setPhotoItem(image ? { name: image.name, path: image.path, type: "image", file: null } : null);
      setVideoItem(video ? { name: video.name, path: video.path, type: "video", file: null } : null);
      setIndex(0);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load media:", error, error?.diagnostics);
      setLoadError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    setAutoRetryCount(0);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortUUID]);

  useEffect(() => {
    const noMedia = !photoItem && !videoItem;
    if (!(loadError || noMedia) || autoRetryCount >= MAX_AUTO_RETRIES || loading) return;
    setRetryCountdown(RETRY_INTERVAL_SEC);
    const tickId = setInterval(() => setRetryCountdown((s) => (s > 0 ? s - 1 : 0)), 1000);
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
  }, [loadError, photoItem, videoItem, autoRetryCount, loading]);

  // Slides in a fixed order: photo first, then live photo (video).
  const slides = useMemo(
    () => [photoItem, videoItem].filter(Boolean),
    [photoItem, videoItem]
  );

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setIndex((prev) => (prev === i ? prev : i));
  };

  const goToSlide = (i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const getFile = async (item) => {
    if (!item) return null;
    if (item.file) return item.file;
    const file = await convertUrlToFile(item.path, item.name);
    if (item === photoItem) setPhotoItem((p) => (p ? { ...p, file } : p));
    if (item === videoItem) setVideoItem((v) => (v ? { ...v, file } : v));
    return file;
  };

  // Prefer the native share sheet (which includes "Save"), fall back to a
  // direct file download.
  const shareOrDownload = async (item) => {
    const file = await getFile(item);
    if (!file) return;
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        /* user cancelled or share failed — fall through to download */
      }
    }
    saveAs(file, item.name);
  };

  // Button click: bring the matching slide into view, then share/download it.
  const selectAndShare = (item) => {
    const slideIndex = slides.indexOf(item);
    if (slideIndex >= 0) goToSlide(slideIndex);
    shareOrDownload(item);
  };

  const hasMedia = slides.length > 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <div className="grammy-share-page">
        <div
          className="grammy-share-frame"
          style={{
            aspectRatio: `${BG_W} / ${BG_H}`,
            backgroundImage: BG_ASSET ? `url(${BG_ASSET})` : undefined,
          }}
        >
          {/* Content sits in the gray middle band of the artwork */}
          <div className="grammy-share-frame__overlay">
            {loading ? (
              <div className="grammy-share-frame__status">
                <ClipLoader color="#58BC47" loading={true} size={64} />
              </div>
            ) : !hasMedia ? (
              <div className="grammy-share-frame__status">
                {autoRetryCount < MAX_AUTO_RETRIES ? (
                  <>
                    <ClipLoader color="#58BC47" loading={true} size={48} />
                    <Typography className="grammy-share-frame__status-title">Just a moment</Typography>
                    <Typography className="grammy-share-frame__status-text">
                      Your photos are still being uploaded.
                    </Typography>
                    <Typography className="grammy-share-frame__status-text">
                      We'll check again in {retryCountdown}s.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography className="grammy-share-frame__status-title">Media not found</Typography>
                    <Typography className="grammy-share-frame__status-text">
                      This share link may have expired.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => window.location.reload()}
                      sx={{ borderRadius: "50px", px: 4, mt: 1, bgcolor: "#58BC47", color: "#fff", "&:hover": { bgcolor: "#47a338" } }}
                    >
                      <Typography fontSize="0.95rem" fontWeight={700} textTransform="none">Try Again</Typography>
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Swipeable carousel: photo ↔ live photo */}
                <div
                  className="grammy-share-frame__carousel"
                  ref={trackRef}
                  onScroll={onTrackScroll}
                >
                  {slides.map((s) => (
                    <div className="grammy-share-frame__slide" key={s.path}>
                      {s.type === "video" ? (
                        <video
                          src={s.path}
                          controls loop autoPlay muted playsInline preload="metadata"
                          className="grammy-share-frame__media-el"
                        />
                      ) : (
                        <img
                          src={s.path}
                          alt="Your photo"
                          decoding="async"
                          className="grammy-share-frame__media-el"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Carousel dots */}
                {slides.length > 1 && (
                  <div className="grammy-share-frame__dots">
                    {slides.map((s, i) => (
                      <button
                        key={s.path}
                        type="button"
                        className={`grammy-share-frame__dot${index === i ? " is-active" : ""}`}
                        onClick={() => goToSlide(i)}
                        aria-label={`Show ${s.type === "video" ? "live photo" : "photo"}`}
                      />
                    ))}
                  </div>
                )}

                {/* PHOTO / LIVE PHOTO — share or download each */}
                <div className="grammy-share-frame__buttons">
                  {photoItem && PHOTO_BTN && (
                    <button
                      type="button"
                      className="grammy-share-frame__btn"
                      onClick={() => selectAndShare(photoItem)}
                    >
                      <img src={PHOTO_BTN} alt="Photo" />
                    </button>
                  )}
                  {videoItem && LIVEPHOTO_BTN && (
                    <button
                      type="button"
                      className="grammy-share-frame__btn"
                      onClick={() => selectAndShare(videoItem)}
                    >
                      <img src={LIVEPHOTO_BTN} alt="Live Photo" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Unique running number — bottom-right corner of the artwork */}
          <div className="grammy-share-frame__serial">{serial}</div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default GrammySharePage;
