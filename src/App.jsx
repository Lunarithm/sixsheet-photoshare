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
import VDO from "./assets/vector.png";
import Backdrop from "@mui/material/Backdrop";
import save from "./assets/saveNew.png";
import share from "./assets/sh.png";
import ReactPlayer from "react-player";
import { ShareSocial } from "react-share-social";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import { saveAs } from "file-saver";
import QRCode from "react-qr-code";
import src from "./assets/cap.png";
import "./assets/font.css";

function App() {
  const [loading, setLoading] = useState(true);

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

  async function convertUrlToFile(url, type) {
    const dataType = type == "img" ? "jpg" : "mp4";
    const blobType = type == "img" ? "image/jpg" : "video/mp4";
    // const response = await fetch(url,{mode: "cors"});
    const response = await axios.get(url, {
      responseType: "blob",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    console.log(response.data);
    const blob = await response.data;
    const file = new File([blob], `media_${shortUUID}.` + dataType, {
      type: blobType,
    });
    if (type == "img") {
      setImgFile(file);
    } else {
      setVdoFile(file);
    }
    return file;
  }

  const dataToApp = async () => {
    try {
      const result = await axios.get(
        `${import.meta.env.VITE_APIHUB_URL}/media/${shortUUID}`
      );
      console.log(import.meta.env.VITE_APIHUB_URL);
      const png = result.data.data.source[0].path;
      let mp4 = "";
      if (result?.data?.data?.source[1]?.path) {
        mp4 = result.data.data.source[1].path;
      } else {
        setDisplayVideo(false);
      }

      // console.log(png);
      setPathImg(png);
      setPathVdo(mp4);
      if (result?.data?.data?.source[2]?.path) {
        const thumbnail = result.data.data.source[2].path;
        setPathThn(thumbnail);
      } else {
        setPathThn(png);
      }

      await convertUrlToFile(png, "img");
      await convertUrlToFile(mp4, "vdo");
      // await convertUrlToFile(thumbnail, "img");
      // setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const goData = async () => {
      try {
        await dataToApp();

        setLoading(false);
      } catch (error) {
        console.error(error);
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
          width: "100vw",
          // height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          // marginTop: "-606px"
        }}
      >
        <Box
          container
          sx={{
            width: "100%",
            maxWidth: "1200px",
            height: "30vh",
            margin: "0 auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            // paddingTop: "40px",
            flexDirection: "column",
            // marginBottom: "40px",
          }}
        >
          <img
            src={src}
            style={{
              width: "70%",
              height: "40%",
              zIndex: 3,
              alignItems: "center",
              justifyContent: "center",
              //  paddingTop: "20px"
            }}
          />
          <Typography
            color="#F4F0D3"
            fontFamily="PPNeueMachinaUltrabold"
            fontSize="2.8em"
            textAlign="center"
            paddingBottom="40px"
            paddingTop="5px"
          >
            DOWNLOAD* Your file
          </Typography>
        </Box>
        <Box className={"box-test all-element-center"}>
          {loading ? (
            <ClipLoader
              color={"#123abc"}
              loading={loading}
              size={100}
              className="all-element-center"
            />
          ) : (
            <Grid>
              <Box className="box-body all-element-center">
                <Grid
                  container
                  spacing={1}
                  className={"grid-body all-element-center"}
                  size={{
                    xs: 3,
                    md: 3,
                  }}
                >
                  <Box className={"grid-body3 all-element-center"}>
                    <div
                      style={{
                        position: "relative",
                        width: "250px",
                        height: "350px",
                        borderRadius: "30px",
                        overflow: "hidden",
                        border: "16px solid  #F4F0D3",
                      }}
                    >
                      <img
                        // onLoad={() => handleLoadImage("img1")}
                        src={pathImg}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          // left:"15px"
                        }}
                      />
                      <div
                        onClick={() => handleImage(pathImg)}
                        style={{
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
                        }}
                      ></div>
                    </div>
                  </Box>
                  {isDisplayVideo ? (
                    <Box className={"grid-body3 all-element-center"}>
                      <div
                        style={{
                          position: "relative",
                          width: "250px",
                          height: "350px",
                          borderRadius: "30px",
                          overflow: "hidden",
                          border: "16px solid  #F4F0D3",
                        }}
                      >
                        {pathThn ? (
                          <img
                            src={pathThn}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <img
                            src={pathImg}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <div
                          onClick={() => handleVdo(pathVdo)}
                          style={{
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
                          }}
                        ></div>
                      </div>
                    </Box>
                  ) : (
                    <div></div>
                  )}
                </Grid>
              </Box>
              {/* <Box className={"box-button all-element-center"}>
                <Grid
                  container
                  className={"grid-body"}
                  size={{
                    xs: 3,
                    md: 3,
                  }}
                >
                  <Box
                    onClick={() => handleImage(pathImg)}
                    className={"box-img-button"}
                  >
                    Image
                  </Box>
                  {isDisplayVideo ? (
                    <Box
                      onClick={() => handleVdo(pathVdo)}
                      className={"box-Vdo-button"}
                    >
                      Video
                    </Box>
                  ) : (
                    <div></div>
                  )}
                </Grid>
              </Box> */}
              <Container className="all-element-center" style={{}}>
                <QRCode
                  size={256}
                  style={{ height: "10vh", maxWidth: "30%", marginTop: "60px" }}
                  value={window.location.href}
                  viewBox={`0 0 256 256`}
                />
              </Container>
            </Grid>
          )}
        </Box>
        <Box className="all-element-center">
          <Modal
            open={open}
            // onClick={handleClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
          >
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
                  onClick={handleClose}
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    backdropFilter: "blur(4px)",
                  }}
                ></Box>
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
                  }}
                >
<Button
                    className="close-popup-button"
                    onClick={handleClose}
                    sx={{
                      position: "absolute",
                      top: "120px",
                      left: "60px",
                    }}
                  >
                    ✖
                  </Button>
                  <br />
                  {vdo ? (
                    <ReactPlayer
                      url={vdo}
                      controls={true}
                      loop={true}
                      style={{
                        maxHeight: "72%",
                        maxWidth: "72%",
                        position: "relative",
                        zIdex: 99999,
                        marginBottom: "20px",
                      }}
                    />
                  ) : image ? (
                    <img
                      src={image}
                      alt="Selected"
                      style={{
                        maxHeight: "68%",
                        maxWidth: "68%",
                        // marginTop: "120px",
                        borderTop: "5px solid Darkgray",
                        borderLeft: "8px solid Darkgray",
                        borderRight: "5px solid Darkgray",
                      }}
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
                  >
                    <Button
                      className="save-popup-button"
                      style={{
                        backgroundColor: "white",
                        width: "15rem",
                        height: "4rem",
                        borderRadius: "50px",
                        padding: "10px 22px",
                        marginRight: "10px"
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
                        style={{ maxHeight: "100%", maxWidth: "100%" }}
                      />
                      <Typography
                        color="Black"
                        // fontFamily="Inter"
                        fontSize="22px"
                        textAlign="center"
                        paddingLeft="10px"
                        fontWeight={400}
                      >
                        DOWNLOAD
                      </Typography>
                    </Button>
                    <Button
                      className="share-popup-button"
                      style={{
                         backgroundColor: "white",
                        width: "15rem",
                        height: "4rem",
                        borderRadius: "50px",
                        padding: "10px 22px",
                        marginLeft: "10px"
                      }}
                      onClick={handleShareClick}
                    >
                      <img
                        src={share}
                        alt="Selected"
                        style={{ maxHeight: "100%", maxWidth: "100%" }}
                      />
                      <Typography
                        color="Black"
                        // fontFamily="Inter"
                        fontSize="22px"
                        textAlign="center"
                        paddingLeft="10px"
                        fontWeight={400}
                      >
                        SHARE
                      </Typography>
                    </Button>
                  </Box>
                </Box>
                <Box
                  onClick={handleClose}
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    backdropFilter: "blur(4px)",
                  }}
                ></Box>
              </Box>
            </Fade>
          </Modal>
        </Box>
        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            height: "20vh",
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
        {/* <Container className="all-element-center" style={{}}>
      <QRCode
    size={256}
    style={{ height: "20vh", maxWidth: "30%" }}
    value={window.location.href}
    viewBox={`0 0 256 256`}
  />
  </Container> */}
      </Container>
    </ThemeProvider>
  );
}

export default App;
