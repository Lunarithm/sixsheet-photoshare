import viteLogo from "/vite.svg";
import { useState, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { lime, purple, red } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import {
  Box,
  Container,
  Modal,
  Fade,
  Button,
  List,
  Typography,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import { theme } from "./assets/theme";
import { RotatingLines } from "react-loader-spinner";
import "./index.css";
import { useNavigate, useParams } from "react-router-dom";
import icon from "./assets/group92.png";
import VDO from "./assets/Vector.png";
import Backdrop from "@mui/material/Backdrop";
import save from "./assets/saveNew.png";
import share from "./assets/sh.png";
import ReactPlayer from "react-player";
import { ShareSocial } from "react-share-social";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import { fetchMediaWithRetry, unregisterStaleServiceWorkers } from "./lib/fetchMedia";
import { saveAs } from "file-saver";
import QRCode from "react-qr-code";
import src from "./assets/cap.png";
import "./assets/font.css";
import "./assets/css/photoShare.css";
import qrIcon from "./assets/Group 58.png";
function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");

  const { shortUUID } = useParams();

  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [vdo, setVdo] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [vdoFile, setVdoFile] = useState(null);
  const [pathImg, setPathImg] = useState("");
  const [pathVdo, setPathVdo] = useState("");
  const [pathThn, setPathThn] = useState("");
  const [shareResult, setShare] = useState(false);
  const [mediaState, setMediaState] = useState("web");
  const [isDisplayVideo, setDisplayVideo] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  const togglePopupQR = () => {
    setShowPopup(!showPopup);
  };

  async function convertUrlToFile(url, type) {
    if (!url) return null;
    const dataType = type == "img" ? "jpg" : "mp4";
    const blobType = type == "img" ? "image/jpeg" : "video/mp4";
    try {
      const response = await axios.get(url, { responseType: "blob" });
      const file = new File([response.data], `media_${shortUUID}.${dataType}`, {
        type: blobType,
      });
      if (type == "img") setImgFile(file);
      else setVdoFile(file);
      return file;
    } catch (err) {
      console.error(`convertUrlToFile failed for ${type}:`, err);
      return null;
    }
  }

  const dataToApp = async () => {
    const { source } = await fetchMediaWithRetry(
      import.meta.env.VITE_APIHUB_URL,
      shortUUID
    );

    // Classify sources by file name — never assume index-based ordering
    const imageItem = source.find(
      (s) => /\.(jpe?g|png|webp)$/i.test(s?.name || "") && !s.name.endsWith("_thumb.jpg")
    );
    const videoItem = source.find((s) =>
      /\.(mp4|webm|mov)$/i.test(s?.name || "")
    );
    const thumbItem = source.find((s) => (s?.name || "").endsWith("_thumb.jpg"));

    const png = imageItem?.path || "";
    const mp4 = videoItem?.path || "";

    setPathImg(png);
    setPathVdo(mp4);
    setPathThn(thumbItem?.path || png);
    setDisplayVideo(Boolean(mp4));

    // Pre-fetch blobs for download/share (failures are non-fatal)
    if (png) await convertUrlToFile(png, "img");
    if (mp4) await convertUrlToFile(mp4, "vdo");
  };

  useEffect(() => {
    const goData = async () => {
      setLoadError(false);
      setErrorDetail("");
      await unregisterStaleServiceWorkers();
      try {
        await dataToApp();
      } catch (error) {
        console.error("Failed to load media after retries:", error, error?.diagnostics);
        setLoadError(true);
        const diag = Array.isArray(error?.diagnostics)
          ? error.diagnostics.map((d) =>
              `#${d.attempt}/${d.via}: ${d.kind}${d.status ? ` [${d.status}]` : ""}${d.contentType ? ` ${d.contentType}` : ""}${d.message ? ` — ${d.message}` : ""}`
            ).join("\n")
          : (error?.message || "Unknown error");
        setErrorDetail(diag);
      } finally {
        setLoading(false);
      }
    };

    goData();
  }, []);

  const togglePopup = () => {
    setShare(!shareResult);
  };

  const handleClose = () => {
    setOpen(false);
    setImage(null);
    setVdo(null);
    setShare(false);
    setShowPopup(false)
  };

  const handleImage = (value) => {
    setImage(value);
    setMediaState("img");
    setOpen(true);
  };

  const handleVdo = (value) => {
    setVdo(value);
    setMediaState("vdo");
    setOpen(true);
  };

  const handleShareClick = async () => {
    const state = mediaState == "img" ? image : vdo;
    if (navigator.share) {
      await navigator
        .share({
          files: mediaState == "img" ? [imgFile] : [vdoFile],
        })
        .then(() => {
          console.log("Successfully shared");
        })
        .catch((error) => {
          alert(error);
        });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Container
        maxWidth={false}
        disableGutters
        component="main"
        sx={{
          // width: "100vw",
          // height: "100vh",
          // display: "flex",
          // flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          direction="column"
          style={{ paddingTop: "40px" }}
        >
          <Grid item size={{ xs: 10, md: 8 }}>
            <img
              src={src}
              style={{
                maxWidth: "100%",
                maxHeight: "50%",
                zIndex: 3,
                display: "block",
                margin: "0 auto",
              }}
              alt="Your image"
            />
          </Grid>
          <Grid item size={{ xs: 10, md: 12 }}>
            <Typography
              className="text-dowload-photo-share"
            >
              DOWNLOAD* Your file
            </Typography>
          </Grid>
        </Grid>

        <Grid
          container
          justifyContent="center"
          alignItems="center"
          direction="column"
          sx={{ width: "100%" }}
        >
          {/* <Grid
            item
            size={{ xs: 12, md: 12 }}
            spacing={1}
            className="all-element-center"
          > */}
          {loading ? (
            <ClipLoader
              color="#123abc"
              loading={loading}
              size={100}
              className="all-element-center"
            />
          ) : loadError || (!pathImg && !pathVdo) ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: "8vh",
                px: "4vw",
                textAlign: "center",
              }}
            >
              <Typography
                color="#F4F0D3"
                fontFamily="Boyrun"
                fontSize="1.6em"
                fontWeight={600}
                sx={{ mb: "8px" }}
              >
                Media not found
              </Typography>
              <Typography color="#F4F0D3" fontFamily="Boyrun" fontSize="1em" sx={{ opacity: 0.8, mb: "20px" }}>
                This share link may have expired or is no longer available.
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.location.reload()}
                sx={{ borderRadius: "50px", px: 4 }}
              >
                <Typography color="black" fontSize="1rem" fontWeight={600} textTransform="none">
                  Try Again
                </Typography>
              </Button>
              {errorDetail && (
                <Box
                  component="pre"
                  sx={{
                    mt: "20px",
                    maxWidth: "90vw",
                    fontSize: "0.7rem",
                    color: "#F4F0D3",
                    opacity: 0.6,
                    textAlign: "left",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {errorDetail}
                </Box>
              )}
            </Box>
          ) : (
            <Grid
              item
              size={{ xs: 12, md: 12 }}
              container
              spacing={2}
              className="all-element-center"
            >
              <Box
                sx={{
                  position: "relative",
                  maxWidth: "44vw",
                  height: "30vh",
                  borderRadius: "10px",
                  border: "12px solid #F4F0D3",
                }}
              >
                <img
                  src={pathImg}
                  alt="thumbnail"
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    const el = e.currentTarget;
                    const attempt = Number(el.dataset.retry || 0);
                    const backoff = [500, 1500, 3500];
                    if (attempt < backoff.length && pathImg) {
                      el.dataset.retry = String(attempt + 1);
                      setTimeout(() => {
                        const sep = pathImg.includes("?") ? "&" : "?";
                        el.src = `${pathImg}${sep}r=${Date.now()}.${attempt + 1}`;
                      }, backoff[attempt]);
                    }
                  }}
                />
                <Box
                  onClick={() => handleImage(pathImg)}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    backgroundImage: `url(${icon})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "32%",
                    cursor: "pointer",
                  }}
                />
              </Box>

              {showPopup && (
                <div
                  className="overlay-box-Qr"
                   onClick={handleClose}
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    zIndex: 99,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                  onClick={(e) => e.stopPropagation()}
                    className="popUp-Qr"
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "20px",
                      background: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Button
                      className="close-popup-button"
                      onClick={togglePopupQR}
                      style={{
                        position: "absolute",
                        top: "-28px",
                        right: "-10px",
                        background: "transparent",
                        paddingTop: "10px",
                      }}
                    >
                      ✖
                    </Button>
                    <QRCode
                      style={{
                        height: "80%",
                        maxWidth: "72%",
                        width: "100%",
                        paddingTop: "18px",
                        paddingBottom: "20px",
                      }}
                      value={window.location.href}
                    />
                    <Typography
                      color="#F4F0D3"
                      fontFamily="Boyrun"
                      fontSize="1.3em"
                      textAlign="center"
                      lineHeight="16px"
                      paddingBottom="10px"
                    >
                      Scan this QR code <br /> to get an image file
                    </Typography>
                  </div>
                </div>
              )}

              {isDisplayVideo && (
                <Box
                  sx={{
                    position: "relative",
                    maxWidth: "44vw",
                    height: "30vh",
                    borderRadius: "10px",
                    border: "12px solid #F4F0D3",
                  }}
                >
                  <img
                    src={pathThn || pathImg}
                    alt="video thumbnail"
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      const el = e.currentTarget;
                      const attempt = Number(el.dataset.retry || 0);
                      const baseSrc = pathThn || pathImg;
                      const backoff = [500, 1500, 3500];
                      if (attempt < backoff.length && baseSrc) {
                        el.dataset.retry = String(attempt + 1);
                        setTimeout(() => {
                          const sep = baseSrc.includes("?") ? "&" : "?";
                          el.src = `${baseSrc}${sep}r=${Date.now()}.${attempt + 1}`;
                        }, backoff[attempt]);
                      } else if (attempt === backoff.length && pathImg && baseSrc !== pathImg) {
                        el.dataset.retry = String(attempt + 1);
                        el.src = pathImg;
                      }
                    }}
                  />
                  <Box
                    onClick={() => handleVdo(pathVdo)}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                      backgroundImage: `url(${VDO})`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      backgroundSize: "32%",
                      cursor: "pointer",
                    }}
                  />
                </Box>
              )}
            </Grid>
          )}
        </Grid>
        {/* </Grid> */}

        <Box
          className="all-element-center"
          style={{
            paddingBottom: "8vh",
          }}
          onClick={handleClose}
        >
          <Modal open={open} closeAfterTransition BackdropComponent={Backdrop}>
            <Fade in={open}>
              <Box
                style={{
                  display: "flex",
                  flexDirection: "row",
                  height: "100vh",
                  width: "100vw",
                  position: "fixed",
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    backdropFilter: "blur(6px)",
                    position: "relative",
                    width: "100vw",
                    height: "100vh",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      maxWidth: "100vw",
                      margin: "0 auto",
                      position: "relative",
                    }}
                  >
                    <Button
                      className="close-popup-button"
                      onClick={handleClose}
                      sx={{
                        position: "absolute",
                        top: -50,
                        left: 40,
                        zIndex: 1000,
                      }}
                    >
                      ✖
                    </Button>
                    {vdo ? (
                      <ReactPlayer
                        url={vdo}
                        controls={true}
                        loop={true}
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
                        style={{
                          maxHeight: "80vh",
                          maxWidth: "72%",
                          position: "relative",
                          zIndex: 99,
                          marginBottom: "20px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      ></ReactPlayer>
                    ) : image ? (
                      <img
                        src={image}
                        alt="Selected"
                        decoding="async"
                        style={{
                          maxHeight: "80vh",
                          maxWidth: "68%",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div></div>
                    )}
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingTop: "40px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        className="save-popup-button"
                        style={{
                          backgroundColor: "white",
                          width: "160px",
                          height: "40px",
                          borderRadius: "50px",
                          // padding: "10px 22px",
                          marginRight: "10px",
                        }}
                        onClick={() => {
                          if (image) {
                            saveAs(imgFile, `image_${shortUUID}.jpg`);
                          } else if (vdo) {
                            saveAs(vdoFile, `video_${shortUUID}.mp4`);
                          }
                        }}
                      >
                        <img
                          src={save}
                          alt="Selected"
                          style={{ maxHeight: "60%", maxWidth: "60%" }}
                        />
                        <Typography
                          color="Black"
                          // fontFamily="Inter"
                          fontSize="1rem"
                          textAlign="center"
                          paddingLeft="8px"
                          fontWeight={600}
                        >
                          DOWNLOAD
                        </Typography>
                      </Button>
                      <Button
                        className="share-popup-button"
                        style={{
                          backgroundColor: "white",
                          width: "160px",
                          height: "40px",
                          borderRadius: "50px",
                          // padding: "10px 22px",
                          marginLeft: "10px",
                        }}
                        onClick={handleShareClick}
                      >
                        <img
                          src={share}
                          alt="Selected"
                          style={{ maxHeight: "60%", maxWidth: "60%" }}
                        />
                        <Typography
                          color="Black"
                          // fontFamily="Inter"
                          fontSize="1rem"
                          textAlign="center"
                          paddingLeft="10px"
                          fontWeight={600}
                        >
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

        <Grid
          container
          justifyContent="center"
          alignItems="center"
          // direction="column"
          // paddingBottom="8vh"
        >
          <Grid item size={{ xs: 8, md: 4 }} className={"all-element-center"}>
            <Button
              variant="contained"
              className={"button-QR-element color-button all-element-center"}
              onClick={togglePopupQR}
            >
              <img
                src={qrIcon}
                style={{
                  maxHidth: "40%",
                  maxHeight: "30px",
                  marginRight: "5px",
                }}
              />
              <Typography
                color="black"
                fontSize="1.2rem"
                // fontFamily="Inter"
                fontWeight={600}
                textTransform="none"
              >
                Show QR
              </Typography>
            </Button>
          </Grid>
        </Grid>

        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "32px",
            // backgroundColor: "transparent",
          }}
        >
          <Typography
            color="#F4F0D3"
            fontFamily="Boyrun"
            fontSize="1.2em"
            fontWeight={200}
            textAlign="center"
          >
            POWERED BY SIXSHEET
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
