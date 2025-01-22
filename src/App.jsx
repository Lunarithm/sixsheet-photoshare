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
import Grid from "@mui/material/Grid2";
import { theme } from "./assets/theme";
import { RotatingLines } from "react-loader-spinner";
import "./index.css";
// import getUUID from './modelControll/dataResult'
import { useNavigate, useParams } from "react-router-dom";
import icon from "./assets/icon.png";
import VDO from "./assets/VDO.png";
import Backdrop from "@mui/material/Backdrop";
import save from "./assets/save.png";
import share from "./assets/share.png";
import ReactPlayer from "react-player";
import { ShareSocial } from "react-share-social";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import { saveAs } from "file-saver";

function App() {
  const [loading, setLoading] = useState(true);

  const { shortUUID } = useParams();
  console.log(shortUUID);

  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [vdo, setVdo] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [vdoFile, setVdoFile] = useState(null);
  const [pathImg, setPathImg] = useState("");
  const [pathVdo, setPathVdo] = useState("");
  const [shareResult, setShare] = useState(false);
  const [mediaState, setMediaState] = useState("web");

  async function convertUrlToFile(url,type) {
    const dataType = type == "img" ? "image.png" : "vdo.mp4"
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], dataType, { type: blob.type });
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
        `https://apihub.sixsheet.me/media/${shortUUID}`
      );
      // console.log(result.data.data.source);
      const png = result.data.data.source[0].path;
      const mp4 = result.data.data.source[1].path;
      // console.log(png);
      setPathImg(png);
      setPathVdo(mp4);
      await convertUrlToFile(png, "img");
      await convertUrlToFile(mp4, "vdo");
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
    console.log(vdoFile);
    if (navigator.share) {
      await navigator
        .share({
          files: mediaState == 'img' ? [imgFile] : [vdoFile],
          title: "SixsheetPhotoshare"
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
      <Container maxWidth={false} disableGutters component="main">
        <Box className={"box-head"}>
          <Grid className={"position-header grid-head frontProp"}>
            {/* <h1>{shortUUID}</h1> */}
            CheesePlease
          </Grid>
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
                        width: "150px",
                        height: "200px",
                        borderRadius: "20px",
                        overflow: "hidden",
                        border: "5px solid black",
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
                  <Box className={"grid-body3 all-element-center"}>
                    <div
                      style={{
                        position: "relative",
                        width: "150px",
                        height: "200px",
                        borderRadius: "20px",
                        overflow: "hidden",
                        border: "5px solid black",
                      }}
                    >
                      <img
                        src={pathImg}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
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
                </Grid>
              </Box>
              <Box className={"box-button all-element-center"}>
                <Grid
                  container
                  spacing={1}
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
                  <Box
                    onClick={() => handleVdo(pathVdo)}
                    className={"box-Vdo-button"}
                  >
                    Video
                  </Box>
                </Grid>
              </Box>
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
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  // top: "150px",
                  height: "100vh",
                  width: "100vw",
                  position: "fixed",
                }}
              >
                <Button className="close-popup-button" onClick={handleClose}>
                  ✖
                </Button>
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
                      // marginTop: "150px",
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

                <div className="overlay-box" style={{ paddingBottom: "50px" }}>
                  {shareResult && (
                    <Box className={"all-element-center share-data"}>
                      <ShareSocial
                        url={image || vdo}
                        // onSocialButtonClicked={(data) => console.log(data)}
                        socialTypes={[
                          "facebook",
                          "twitter",
                          "reddit",
                          "linkedin",
                        ]}
                        // className={"share-data"}
                      />
                    </Box>
                  )}
                </div>

                <Box
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "20px",
                  }}
                >
                  <Button
                    className="save-popup-button"
                    onClick={() => {
                      if (image) {
                        saveAs(image, "image.png");
                      } else if (vdo) {
                        saveAs(vdo, "video.mp4");
                      }
                    }}
                  >
                    <img
                      src={save}
                      alt="Selected"
                      style={{ maxHeight: "140px", maxWidth: "140px" }}
                    />
                  </Button>
                  <Button
                    className="share-popup-button"
                    onClick={handleShareClick}
                  >
                    <img
                      src={share}
                      alt="Selected"
                      style={{ maxHeight: "68px", maxWidth: "68px" }}
                    />
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Modal>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
