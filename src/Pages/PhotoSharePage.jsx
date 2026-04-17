import { useState, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Container,
  Modal,
  Fade,
  Button,
  Typography,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import { theme } from "../assets/theme";
import "../index.css";
import { useParams } from "react-router-dom";
import icon from "../assets/group92.png";
import VDO from "../assets/Vector.png";
import Backdrop from "@mui/material/Backdrop";
import save from "../assets/saveNew.png";
import share from "../assets/sh.png";
import ReactPlayer from "react-player";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import { saveAs } from "file-saver";
import QRCode from "react-qr-code";
import src from "../assets/cap.png";
import "../assets/font.css";
import "../assets/css/photoShare.css";
import qrIcon from "../assets/Group 58.png";

// Icons for media type labels
import PhotoIcon from "@mui/icons-material/Photo";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import VideocamIcon from "@mui/icons-material/Videocam";

function PhotoSharePage() {
  const { shortUUID } = useParams();

  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState([]); // [{ name, path, type, file }]
  const [selectedMedia, setSelectedMedia] = useState(null); // current item in modal
  const [showPopup, setShowPopup] = useState(false);

  // Determine media type from file name
  const getMediaType = (name) => {
    if (name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov")) return "video";
    return "image";
  };

  // Determine display label from file name
  const getLabel = (name) => {
    if (name.startsWith("slideshow")) return "Slideshow";
    if (name.startsWith("video_Result")) return "Video";
    return "Photo";
  };

  const getLabelIcon = (name) => {
    if (name.startsWith("slideshow")) return <SlideshowIcon sx={{ fontSize: 18, mr: 0.5 }} />;
    if (name.startsWith("video_Result")) return <VideocamIcon sx={{ fontSize: 18, mr: 0.5 }} />;
    return <PhotoIcon sx={{ fontSize: 18, mr: 0.5 }} />;
  };

  // Convert URL to File object for native share API
  async function convertUrlToFile(url, name) {
    try {
      const response = await axios.get(url, { responseType: "blob" });
      const ext = name.split(".").pop().toLowerCase();
      const mimeMap = {
        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
      };
      const mimeType = mimeMap[ext] || "application/octet-stream";
      return new File([response.data], `${name}`, { type: mimeType });
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAYS_MS = [500, 1500]; // delays before attempt 2 and 3

    const fetchWithRetry = async () => {
      let lastError = null;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const result = await axios.get(
            `${import.meta.env.VITE_APIHUB_URL}/media/${shortUUID}`,
            { timeout: 15000 }
          );
          const source = Array.isArray(result?.data?.data?.source)
            ? result.data.data.source
            : Array.isArray(result?.data?.source)
            ? result.data.source
            : null;
          if (source && source.length > 0) return source;
          lastError = new Error("Empty or malformed response");
        } catch (err) {
          lastError = err;
        }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
        }
      }
      throw lastError;
    };

    const fetchData = async () => {
      try {
        const source = await fetchWithRetry();

        // Build thumbnail lookup keyed by base name (extension-agnostic)
        const thumbMap = {};
        for (const s of source) {
          if (s.name.endsWith("_thumb.jpg")) {
            const baseName = s.name.replace("_thumb.jpg", "");
            thumbMap[baseName] = s.path;
          }
        }

        // Display items exclude thumbnail files
        const displaySource = source.filter((s) => !s.name.endsWith("_thumb.jpg"));

        // Image-only fallback — never a video URL (Safari won't render it as <img>)
        const imageItem = displaySource.find((s) =>
          /\.(jpe?g|png|webp)$/i.test(s.name)
        );
        const imageOnlyFallback = imageItem?.path || "";

        const items = displaySource.map((item) => {
          const type = getMediaType(item.name);
          const baseName = item.name.replace(/\.[^.]+$/, "");
          const thumbnail =
            type === "video"
              ? thumbMap[baseName] || imageOnlyFallback
              : item.path;
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
        console.error("Failed to load media:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [shortUUID]);

  const handleOpen = (item) => setSelectedMedia(item);
  const handleClose = () => {
    setSelectedMedia(null);
    setShowPopup(false);
  };

  // Download file on demand (lazy — not pre-downloaded)
  const getFile = async (item) => {
    if (item.file) return item.file;
    const file = await convertUrlToFile(item.path, item.name);
    // Cache it for next time
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
      <Container
        maxWidth={false}
        disableGutters
        component="main"
        sx={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}
      >
        {/* Header */}
        <Grid container justifyContent="center" alignItems="center" direction="column" sx={{ pt: "40px" }}>
          <Grid item size={{ xs: 10, md: 8 }}>
            <img src={src} style={{ maxWidth: "100%", maxHeight: "50%", display: "block", margin: "0 auto" }} alt="Logo" />
          </Grid>
          <Grid item size={{ xs: 10, md: 12 }}>
            <Typography className="text-dowload-photo-share">DOWNLOAD* Your file</Typography>
          </Grid>
        </Grid>

        {/* Media grid */}
        <Grid container justifyContent="center" alignItems="center" direction="column" sx={{ width: "100%" }}>
          {loading ? (
            <ClipLoader color="#123abc" loading={loading} size={100} className="all-element-center" />
          ) : (
            <Grid item size={{ xs: 12, md: 12 }} container spacing={2} className="all-element-center">
              {mediaItems.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    position: "relative",
                    maxWidth: mediaItems.length <= 2 ? "44vw" : "30vw",
                    height: "30vh",
                    borderRadius: "10px",
                    border: "12px solid #F4F0D3",
                  }}
                >
                  {/* Thumbnail — image-only, with retry on transient Safari fetch failures */}
                  <img
                    src={item.thumbnail}
                    alt={item.label}
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      const el = e.currentTarget;
                      const attempt = Number(el.dataset.retry || 0);
                      if (attempt < 1 && item.thumbnail) {
                        el.dataset.retry = String(attempt + 1);
                        const sep = item.thumbnail.includes("?") ? "&" : "?";
                        el.src = `${item.thumbnail}${sep}r=${Date.now()}`;
                      }
                    }}
                  />

                  {/* Click overlay */}
                  <Box
                    onClick={() => handleOpen(item)}
                    sx={{
                      position: "absolute",
                      top: 0, left: 0, width: "100%", height: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      backgroundImage: `url(${item.type === "video" ? VDO : icon})`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundSize: "32%",
                      cursor: "pointer",
                    }}
                  />

                </Box>
              ))}
            </Grid>
          )}
        </Grid>

        {/* QR popup */}
        {showPopup && (
          <div
            className="overlay-box-Qr"
            onClick={handleClose}
            style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.2)", backdropFilter: "blur(6px)",
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
              }}
            >
              <Button
                className="close-popup-button"
                onClick={() => setShowPopup(false)}
                style={{ position: "absolute", top: "-28px", right: "-10px", background: "transparent", paddingTop: "10px" }}
              >
                X
              </Button>
              <QRCode
                style={{ height: "80%", maxWidth: "72%", width: "100%", paddingTop: "18px", paddingBottom: "20px" }}
                value={window.location.href}
              />
              <Typography color="#F4F0D3" fontFamily="Boyrun" fontSize="1.3em" textAlign="center" lineHeight="16px" paddingBottom="10px">
                Scan this QR code <br /> to get an image file
              </Typography>
            </div>
          </div>
        )}

        {/* Media modal */}
        <Box className="all-element-center" sx={{ pb: "8vh" }} onClick={handleClose}>
          <Modal open={!!selectedMedia} closeAfterTransition BackdropComponent={Backdrop}>
            <Fade in={!!selectedMedia}>
              <Box sx={{ display: "flex", flexDirection: "row", height: "100vh", width: "100vw", position: "fixed" }}>
                <Box sx={{
                  flexShrink: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.3)", backdropFilter: "blur(6px)",
                  position: "relative", width: "100vw", height: "100vh", overflow: "hidden",
                }}>
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", maxWidth: "100vw", margin: "0 auto", position: "relative",
                  }}>
                    <Button className="close-popup-button" onClick={handleClose}
                      sx={{ position: "absolute", top: -50, left: 40, zIndex: 1000 }}>
                      X
                    </Button>

                    {selectedMedia?.type === "video" ? (
                      <ReactPlayer
                        url={selectedMedia.path}
                        controls
                        loop
                        playing
                        muted
                        playsinline
                        config={{
                          file: {
                            attributes: {
                              playsInline: true,
                              "webkit-playsinline": "true",
                              preload: "metadata",
                            },
                          },
                        }}
                        style={{ maxHeight: "80vh", maxWidth: "72%", position: "relative", zIndex: 99, marginBottom: "20px" }}
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

                    {/* Download + Share buttons */}
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

        {/* QR button */}
        <Grid container justifyContent="center" alignItems="center">
          <Grid item size={{ xs: 8, md: 4 }} className="all-element-center">
            <Button variant="contained" className="button-QR-element color-button all-element-center"
              onClick={() => setShowPopup(true)}>
              <img src={qrIcon} style={{ maxHeight: "30px", marginRight: "5px" }} />
              <Typography color="black" fontSize="1.2rem" fontWeight={600} textTransform="none">
                Show QR
              </Typography>
            </Button>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ position: "fixed", bottom: 0, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", p: "32px" }}>
          <Typography color="#F4F0D3" fontFamily="Boyrun" fontSize="1.2em" fontWeight={200} textAlign="center">
            POWERED BY SIXSHEET
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default PhotoSharePage;
