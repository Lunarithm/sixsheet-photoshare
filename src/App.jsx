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
// import Medias from './model/medias';
// import png from "./assets/01.png";
// import mp4 from "./assets/video_Result.mp4";
import icon from "./assets/icon.png";
import VDO from "./assets/VDO.png";
import Backdrop from "@mui/material/Backdrop";
import save from "./assets/save.png";
import share from "./assets/share.png";
import ReactPlayer from "react-player";
import { ShareSocial } from "react-share-social";
import axios from "axios";

function App() {
  // const [loading, setLoading] = useState(false);
  // const [isComplete, setIsComplete] = useState(false);

  const { shortUUID } = useParams();
  console.log(shortUUID);

  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [vdo, setVdo] = useState(null);
  const [pathImg, setPathImg] = useState("");
  const [pathVdo, setPathVdo] = useState("");
  const [shareResult, setShare] = useState(false);

  const dataToApp = async () => {
    try {
      const result = await axios.get(
        `https://apihub.sixsheet.me/media/${shortUUID}`
      );
      console.log(result.data.data.source);
      const png = result.data.data.source[0].path;
      const mp4 = result.data.data.source[1].path;
      console.log(png);
      setPathImg(png);
      setPathVdo(mp4);
    } catch (error) {
      console.error("Error fetching paths:", error);
    }
  };

  useEffect(() => {
    dataToApp();
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
    setOpen(true);
  };

  const handleVdo = (value) => {
    setVdo(value);
    setOpen(true);
  };

  // function handleSave() {
  //   alert("Button clicked!");
  // }

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
        <Box className="box-body all-element-center">
          <Grid
            container
            spacing={1}
            className={"grid-body"}
            size={{
              xs: 3,
              md: 3,
            }}
          >
            <Box className={"grid-body3 all-element-center"}>
              <div
                style={{
                  position: "relative",
                  width: "160px",
                  height: "230px",
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
                    backgroundSize: "cover",
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
                  width: "160px",
                  height: "230px",
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
                    backgroundSize: "cover",
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
            <Box onClick={() => handleImage(pathImg)} className={"box-img-button"}>Image</Box>
            <Box onClick={() => handleVdo(pathVdo)} className={"box-Vdo-button"}>video</Box>
          </Grid>
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
                  height: "100vh",
                  width: "100vw",
                  position: "fixed",
                }}
              >
                {vdo ? (
                  <ReactPlayer
                    url={vdo}
                    controls={true}
                    style={{
                      maxHeight: "72%",
                      maxWidth: "72%",
                      marginTop: "120px",
                    }}
                  />
                ) : image ? (
                  <img
                    src={image}
                    alt="Selected"
                    style={{
                      maxHeight: "68%",
                      maxWidth: "68%",
                      marginTop: "120px",
                      borderTop: "5px solid Darkgray",
    borderLeft: "8px solid Darkgray", 
    borderRight: "5px solid Darkgray",
                    }}
                  />
                ) : (
                  <div>No content available</div>
                )}

                <div class="overlay-box" style={{ paddingBottom: "50px" }}>
                  {shareResult && (
                    <div>
                      <ShareSocial
                        url={image || vdo}
                        onSocialButtonClicked={(data) => console.log(data)}
                        socialTypes={[
                          "facebook",
                          "twitter",
                          "reddit",
                          "linkedin",
                        ]}
                        className={"share"}
                      />
                    </div>
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
                  <Button className="close-popup-button" onClick={handleClose}>
                    ✖
                  </Button>
                  <Button
                    className="save-popup-button"
                    onClick={() => {
                      if (image) {
                        const link = document.createElement("a");
                        link.href = image;
                        link.download = "image";
                        link.click();
                      } else if (vdo) {
                        const link = document.createElement("a");
                        link.href = vdo;
                        link.download = "video";
                        link.click();
                      }
                    }}
                  >
                    <img
                      src={save}
                      alt="Selected"
                      style={{ maxHeight: "100px", maxWidth: "100px" }}
                    />
                  </Button>
                  <Button className="share-popup-button" onClick={togglePopup}>
                    <img
                      src={share}
                      alt="Selected"
                      style={{ maxHeight: "52px", maxWidth: "52px" }}
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
