import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Modal,
  Fade,
  Button,
  Typography,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "../assets/theme";
import "../index.css";
import { useParams } from "react-router-dom";
import VDO from "../assets/Vector.png";
import photoIcon from "../assets/group92.png";
import Backdrop from "@mui/material/Backdrop";
import save from "../assets/saveNew.png";
import share from "../assets/sh.png";
import ClipLoader from "react-spinners/ClipLoader";
import { fetchMediaWithRetry, unregisterStaleServiceWorkers } from "../lib/fetchMedia";
import { saveAs } from "file-saver";
import QRCode from "react-qr-code";
import "../assets/font.css";
import "../assets/css/visaShare.css";

import visaLogo from "../assets/visa/visa-logo.svg";
import bgTexture from "../assets/visa/texture-bg.png";
import mascot from "../assets/visa/mascot.png";

// Visa-styled share page — single-photo layout cloned from the kiosk's
// VisaShare aesthetic: deep blue background + paper texture, white VISA
// logo top-right, polaroid-style media card centered, "Show QR" pill
// underneath, blue yeti + cat mascot anchored to the bottom.
function VisaSharePage() {
  const { shortUUID } = useParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const MAX_AUTO_RETRIES = 12;
  const RETRY_INTERVAL_SEC = 10;

  const getMediaType = (name) => {
    if (name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov")) return "video";
    return "image";
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

      const imageItem = displaySource.find((s) =>
        /\.(jpe?g|png|webp)$/i.test(s.name)
      );
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
        ? error.diagnostics.map((d) =>
            `#${d.attempt}/${d.via}: ${d.kind}${d.status ? ` [${d.status}]` : ""}${d.contentType ? ` ${d.contentType}` : ""}${d.message ? ` — ${d.message}` : ""}`
          ).join("\n")
        : (error?.message || "Unknown error");
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

  const handleOpen = (item) => setSelectedMedia(item);
  const handleClose = () => {
    setSelectedMedia(null);
    setShowPopup(false);
  };

  const getFile = async (item) => {
    if (item.file) return item.file;
    const file = await convertUrlToFile(item.path, item.name);
    setMediaItems((prev) => prev.map((m) => m.name === item.name ? { ...m, file } : m));
    return file;
  };

  const handleDownload = async () => {
    if (!selectedMedia) return;
    const file = await getFile(selectedMedia);
    if (file) saveAs(file, selectedMedia.name);
  };

  const handleShare = async () => {
    if (!selectedMedia || !navigator.share) return;
    try {
      const file = await getFile(selectedMedia);
      if (file) await navigator.share({ files: [file] });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <div className="visa-share-page">
        <div className="visa-share-page__bg" aria-hidden="true" />
        <div
          className="visa-share-page__texture"
          aria-hidden="true"
          style={{ backgroundImage: `url(${bgTexture})` }}
        />

        <img
          className="visa-share-page__logo"
          src={visaLogo}
          alt="VISA"
          draggable={false}
        />

        <main className="visa-share-page__content">
          {loading ? (
            <div className="visa-share-page__status">
              <ClipLoader color="#F4F0D3" loading={true} size={80} />
            </div>
          ) : loadError || mediaItems.length === 0 ? (
            <div className="visa-share-page__status">
              {autoRetryCount < MAX_AUTO_RETRIES ? (
                <>
                  <ClipLoader color="#F4F0D3" loading={true} size={56} />
                  <Typography className="visa-share-page__status-title">
                    Just a moment
                  </Typography>
                  <Typography className="visa-share-page__status-text">
                    Your photos are still being uploaded.
                  </Typography>
                  <Typography className="visa-share-page__status-text">
                    This usually takes 10–30 seconds. We'll check again in {retryCountdown}s.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setAutoRetryCount((n) => n + 1);
                      setLoading(true);
                      fetchData();
                    }}
                    sx={{ borderRadius: "50px", px: 4, mt: 2, bgcolor: "#ffffff", color: "#1a37ca", "&:hover": { bgcolor: "#f4f0d3" } }}
                  >
                    <Typography fontSize="1rem" fontWeight={600} textTransform="none">
                      Check Now
                    </Typography>
                  </Button>
                </>
              ) : (
                <>
                  <Typography className="visa-share-page__status-title">
                    Media not found
                  </Typography>
                  <Typography className="visa-share-page__status-text">
                    This share link may have expired or is no longer available.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => window.location.reload()}
                    sx={{ borderRadius: "50px", px: 4, mt: 2, bgcolor: "#ffffff", color: "#1a37ca", "&:hover": { bgcolor: "#f4f0d3" } }}
                  >
                    <Typography fontSize="1rem" fontWeight={600} textTransform="none">
                      Try Again
                    </Typography>
                  </Button>
                  {errorDetail && (
                    <Box component="pre" className="visa-share-page__status-debug">
                      {errorDetail}
                    </Box>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="visa-share-page__cards">
                {mediaItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="visa-share-page__card"
                    onClick={() => handleOpen(item)}
                    aria-label={`Open ${item.type}`}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.type}
                      loading="lazy"
                      decoding="async"
                      className="visa-share-page__card-img"
                      onError={(e) => {
                        const el = e.currentTarget;
                        const attempt = Number(el.dataset.retry || 0);
                        const backoff = [500, 1500, 3500];
                        if (attempt < backoff.length && item.thumbnail) {
                          el.dataset.retry = String(attempt + 1);
                          setTimeout(() => {
                            const sep = item.thumbnail.includes("?") ? "&" : "?";
                            el.src = `${item.thumbnail}${sep}r=${Date.now()}.${attempt + 1}`;
                          }, backoff[attempt]);
                        }
                      }}
                    />
                    <span
                      className="visa-share-page__card-play"
                      style={{ backgroundImage: `url(${item.type === "video" ? VDO : photoIcon})` }}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="visa-share-page__qr-btn"
                onClick={() => setShowPopup(true)}
              >
                <span className="visa-share-page__qr-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="currentColor"
                      d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10 0h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v-2h-2v2zm2 0h2v2h-2v-2zm2 0h2v-2h2v2h-2v2h-2v-2zm0-4h2v2h-2v-2zm-2-4h2v2h-2v-2z"
                    />
                  </svg>
                </span>
                <span className="visa-share-page__qr-label">Show QR</span>
              </button>
            </>
          )}
        </main>

        <img
          className="visa-share-page__mascot"
          src={mascot}
          alt=""
          aria-hidden="true"
          draggable={false}
        />

        {showPopup && (
          <div
            className="overlay-box-Qr"
            onClick={handleClose}
            style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.45)", backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)", zIndex: 99,
              display: "flex", justifyContent: "center", alignItems: "center",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="popUp-Qr"
              style={{
                position: "relative", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                borderRadius: "20px", background: "rgba(255, 255, 255, 0.1)",
                padding: "24px",
              }}
            >
              <Button
                className="close-popup-button"
                onClick={() => setShowPopup(false)}
                style={{ position: "absolute", top: "-28px", right: "-10px", background: "transparent", paddingTop: "10px", color: "#ffffff" }}
              >
                X
              </Button>
              <Box sx={{ bgcolor: "#ffffff", p: 2, borderRadius: "12px" }}>
                <QRCode
                  style={{ height: "auto", maxWidth: "260px", width: "100%" }}
                  value={window.location.href}
                />
              </Box>
              <Typography color="#ffffff" fontSize="1.05em" textAlign="center" lineHeight="1.3" paddingTop="14px">
                Scan this QR code <br /> to get an image file
              </Typography>
            </div>
          </div>
        )}

        <Box onClick={handleClose}>
          <Modal open={!!selectedMedia} closeAfterTransition BackdropComponent={Backdrop}>
            <Fade in={!!selectedMedia}>
              <Box sx={{ display: "flex", flexDirection: "row", height: "100vh", width: "100vw", position: "fixed" }}>
                <Box sx={{
                  flexShrink: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.35)", backdropFilter: "blur(6px)",
                  position: "relative", width: "100vw", height: "100vh", overflow: "hidden",
                }}>
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", maxWidth: "100vw", margin: "0 auto", position: "relative",
                  }}>
                    <Button className="close-popup-button" onClick={handleClose}
                      sx={{ position: "absolute", top: -50, left: 40, zIndex: 1000, color: "#ffffff" }}>
                      X
                    </Button>

                    {selectedMedia?.type === "video" ? (
                      <video
                        src={selectedMedia.path}
                        controls
                        loop
                        autoPlay
                        muted
                        playsInline
                        preload="metadata"
                        style={{
                          maxHeight: "80vh", maxWidth: "72vw",
                          width: "auto", height: "auto",
                          position: "relative", zIndex: 99,
                          marginBottom: "20px", background: "black",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : selectedMedia?.type === "image" ? (
                      <img
                        src={selectedMedia.path}
                        alt="Selected"
                        decoding="async"
                        style={{ maxHeight: "80vh", maxWidth: "68%" }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : null}

                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", pt: "40px" }}
                      onClick={(e) => e.stopPropagation()}>
                      <Button className="save-popup-button"
                        sx={{ bgcolor: "white", width: 160, height: 40, borderRadius: "50px", mr: "10px" }}
                        onClick={handleDownload}>
                        <img src={save} alt="Download" style={{ maxHeight: "60%", maxWidth: "60%" }} />
                        <Typography color="black" fontSize="1rem" textAlign="center" pl="8px" fontWeight={600}>
                          DOWNLOAD
                        </Typography>
                      </Button>
                      <Button className="share-popup-button"
                        sx={{ bgcolor: "white", width: 160, height: 40, borderRadius: "50px", ml: "10px" }}
                        onClick={handleShare}>
                        <img src={share} alt="Share" style={{ maxHeight: "60%", maxWidth: "60%" }} />
                        <Typography color="black" fontSize="1rem" textAlign="center" pl="10px" fontWeight={600}>
                          SHARE
                        </Typography>
                      </Button>
                    </Box>
                  </div>
                </Box>
              </Box>
            </Fade>
          </Modal>
        </Box>
      </div>
    </ThemeProvider>
  );
}

export default VisaSharePage;
