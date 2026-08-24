import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "../assets/theme";
import { saveAs } from "file-saver";
import "../index.css";
import "../assets/font.css";
import "../assets/css/grammyShare.css";

// Grammy artwork from src/assets/grammy/, matched on basename.
const GRAMMY_ASSETS = import.meta.glob(
  "../assets/grammy/*.{png,jpg,jpeg,svg,webp}",
  { eager: true, import: "default" }
);
const basename = (p) => p.toLowerCase().split("/").pop();
const assetWhere = (pred) => {
  const entry = Object.entries(GRAMMY_ASSETS).find(([path]) => pred(basename(path)));
  return entry ? entry[1] : null;
};
const BG_ASSET = assetWhere((b) => b.includes("exclusive") && b.includes("bg"));

// The fixed exclusive reward video.
const VIDEO_URL = "https://sx-photoshare.s3.ap-southeast-2.amazonaws.com/grammy/Video+Ex.mp4";
const VIDEO_FILENAME = "grammy-exclusive-video.mp4";

// Per-device running number ("NO. MP0001"): assigned once on first visit from a
// device and persisted in localStorage, so each NEW device that opens this link
// gets its own stable serial. (Not a global sequential counter — that needs a
// backend to assign/store numbers centrally.)
const SERIAL_STORAGE_KEY = "grammyExclusiveSerial";
const RUNNING_PREFIX = "MP";
const RUNNING_PAD = 4;
// Format a numeric running number as "NO. MP0001".
function formatSerial(n) {
  return `NO. ${RUNNING_PREFIX}${String(n).padStart(RUNNING_PAD, "0")}`;
}

// Fallback only — a per-device serial for direct visits that arrive without the
// kiosk-assigned ?no=. The real reward link always carries the claimed number.
function getOrCreateSerial() {
  try {
    const existing = localStorage.getItem(SERIAL_STORAGE_KEY);
    if (existing) return existing;
    const n = Math.floor(Math.random() * 10 ** RUNNING_PAD) || 1;
    const serial = formatSerial(n);
    localStorage.setItem(SERIAL_STORAGE_KEY, serial);
    return serial;
  } catch {
    return `NO. ${RUNNING_PREFIX}${"0".repeat(RUNNING_PAD)}`;
  }
}

/**
 * Grammy "Exclusive Video Reward" page (portrait, fixed content). The artwork
 * (exclusive_bg) bakes in the header, logos, decorations and footer; this page
 * overlays the reward video (with a play.png overlay) and a DOWNLOAD button that
 * shares (or downloads) the clip. Served at /grammy-exclusive-video.
 */
function GrammyExclusiveVideo() {
  const [searchParams] = useSearchParams();
  // Prefer the kiosk-assigned running number from the link (?no=42); fall back
  // to a per-device serial for direct visits without one.
  const [serial] = useState(() => {
    const no = searchParams.get("no");
    if (no && /^\d+$/.test(no)) {
      const s = formatSerial(no);
      try { localStorage.setItem(SERIAL_STORAGE_KEY, s); } catch { /* ignore */ }
      return s;
    }
    return getOrCreateSerial();
  });

  // Labelled "DOWNLOAD" but prefers the native share sheet (which includes
  // "Save"), falling back to a direct download, then to opening the file.
  const shareOrDownload = async () => {
    try {
      const res = await fetch(VIDEO_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], VIDEO_FILENAME, { type: "video/mp4" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch {
          /* user cancelled or share failed — fall through to download */
        }
      }
      saveAs(file, VIDEO_FILENAME);
    } catch (err) {
      console.error("Share/download failed:", err);
      window.open(VIDEO_URL, "_blank", "noopener");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <div className="grammy-share-page">
        <div
          className="grammy-share-frame"
          style={{ backgroundImage: BG_ASSET ? `url(${BG_ASSET})` : undefined }}
        >
          <div className="grammy-exclusive__overlay">
            <div className="grammy-exclusive__video-wrap">
              <video
                src={VIDEO_URL}
                playsInline
                controls
                preload="auto"
                className="grammy-exclusive__video"
              />
            </div>

            <button
              type="button"
              className="grammy-exclusive__download"
              onClick={shareOrDownload}
            >
              DOWNLOAD
            </button>
          </div>

          {/* Per-device running number — bottom-right corner */}
          <div className="grammy-share-frame__serial">{serial}</div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default GrammyExclusiveVideo;
