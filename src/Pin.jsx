import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Container,
  Typography,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid2";
import { theme } from "./assets/theme";
import "./index.css";
import PinInput from 'react-pin-input';
import axios from "axios";

function Pin() {

  const [pinVerify, setPinVerify] = useState(false);
  const [pin, setPin] = useState("");
  const [pinMaster,setPinMaster] = useState("");
  const [limit,setLimit] = useState(20);
  const [offset,setOffset] = useState(0);
  const [medias,setMedias] = useState([]);

  const checkPin = async (value,index) => {
    const pinValue = value.toString();
    if(pinValue == pinMaster){
      setPinVerify(true);
    }
  }

  const fetchMedias = async () => {
    return axios.get(`${import.meta.env.VITE_APIHUB_URL}/media/fetch/list?$limit=${limit}&offset=${offset}`
    );
  }

  useEffect(()=>{
    axios.get(
      `${import.meta.env.VITE_APIHUB_URL}/media/fetch/pin`
    ).then((result)=>{
      setPinMaster(result?.data?.data?.pin || null);
    });

  },[]);

  const pinComponent = (<Container className={"all-element-center"}>
    <Grid xs={12}><PinInput
      length={4}
      initialValue={pin}
      secret
      type="custom"
      style={{ marginTop: "30vh", padding: '10px' }}
      inputStyle={{ borderColor: 'black', backgroundColor: "white", width: "5em", height: "5em" }}
      autoSelect={true}
      onComplete={checkPin}
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
        style={{ minHeight: "100vh", backgroundColor: "#4BAE4D" }}>
        <Box className={"box-head"}>
          <Grid className={"position-header grid-head frontProp"}>
            {/* <h1>{shortUUID}</h1> */}
            SX.Autobooth
          </Grid>
        </Box>
        {pinVerify ? <div></div> : pinComponent}
      </Container>
    </ThemeProvider>
  );
}

export default Pin;
