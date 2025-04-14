import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Container,
  Typography,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import { theme } from "../assets/theme";
import "../index.css";
import PinInput from 'react-pin-input';
import axios from "axios";

import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import moment from 'moment-timezone';

import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

import ClipLoader from "react-spinners/ClipLoader";

function Gallery() {

  const [pinVerify, setPinVerify] = useState(false);
  const [pin, setPin] = useState("");
  const [pinMaster, setPinMaster] = useState("");
  const [limit, setLimit] = useState(21);
  const [offset, setOffset] = useState(0);
  const [medias, setMedias] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loader, setLoader] = useState(true);

  const checkPin = async (value, index) => {
    const pinValue = value.toString();
    if (pinValue == pinMaster) {
      setPinVerify(true);
      fetchMedias().then((response) => {
        setMedias(response.data.data.rows);
        setTotal(Math.ceil(response.data.data.count / 21));
        setLoader(false);
      });
    }
  }

  const fetchMedias = async () => {
    return axios.get(`${import.meta.env.VITE_APIHUB_URL}/media/fetch/list?limit=${limit}&offset=${offset}`
    );
  }

  const openInNewTab = (shortUUID) => {
    const newWindow = window.open(`${import.meta.env.VITE_PHOTOSHARE}/media/${shortUUID}`, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
  }

  useEffect(() => {
    axios.get(
      `${import.meta.env.VITE_APIHUB_URL}/media/fetch/pin`
    ).then((result) => {
      setPinMaster(result?.data?.data?.pin || null);
    });

  }, []);

  // useEffect(() => {
  //   console.log('Updated medias:', medias);
  // }, [medias]);

  useEffect(() => {
    setOffset((page * 21) - 21);
    setLimit(21);
  }, [page]);

  useEffect(() => {
    if (medias.length !== 0) {
      setLoader(true);
      fetchMedias().then((response) => {
        setMedias(response.data.data.rows);
        setLoader(false);
      });
    }
  }, [offset, limit]);

  const pinComponent = (<Container className={"all-element-center"}>
    <Grid xs={12}><PinInput
      length={4}
      initialValue={pin}
      secret
      type="numberic"
      style={{ marginTop: "30vh", padding: '10px' }}
      inputStyle={{ borderColor: 'black', backgroundColor: "white", width: "5em", height: "5em" }}
      autoSelect={true}
      onComplete={checkPin}
      focus={true}
    />
      <Typography className={"all-element-center"} color={"white"} variant="h4" gutterBottom>
        Put yor PIN
      </Typography>
    </Grid>


  </Container>)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Container disableGutters component="main"
        style={{
          minHeight: "100vh", backgroundColor: "#4BAE4D", display: 'flex',
          flexDirection: 'column', paddingBottom: "50px"
        }}>
        <Box className={"box-head"}>
          <Grid className={"position-header grid-head frontProp"}>
            {/* <h1>{shortUUID}</h1> */}
            SX.Autobooth
          </Grid>
        </Box>
        {pinVerify ?
          (<Container>
            {loader ? (<ClipLoader
              color={"#123abc"}
              loading={loader}
              size={100}
              className="all-element-center"
            />) : (<ImageList gap={4} cols={3} sx={{ width: "100%", height: "auto" }}>
              {medias.map((item) => (
                <ImageListItem key={item.uuid}>
                  <img
                    src={`${item.source[0].path}`}
                    loading="lazy"
                  />
                  <ImageListItemBar
                    title={moment(item.updatedAt).tz("Asia/Bangkok").format('LLLL')}
                    subtitle={item.shortUUID}
                    actionIcon={
                      <IconButton
                        onClick={() => openInNewTab(item.shortUUID)}
                        sx={{ color: 'rgba(255, 255, 255, 1)' }}
                      >
                        <InfoIcon />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>)}


          </Container>) : pinComponent}
        <Box
          component="footer"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '64px',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #ccc',
          }}
        >
          <Grid className={"all-element-center"} style={{ padding: "20px" }}>
            <Pagination
              variant="outlined"
              shape="rounded"
              count={total}
              onChange={(event, page) => { setPage(page) }} />
          </Grid>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default Gallery;
