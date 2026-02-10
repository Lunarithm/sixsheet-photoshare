import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Button,
  Container,
  List,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Autocomplete,
  Chip,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import { theme3 } from "../assets/theme";
import PinInput from "react-pin-input";
import axios from "axios";
// import { DateRangePicker } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";
import ClipLoader from "react-spinners/ClipLoader";

import Pagination from "@mui/material/Pagination";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css";
import { DateRangePicker } from "react-date-range";

import "../assets/css/selectionPage.css";
import {
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOffer";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SearchIcon from "../assets/searchIcon.png";
import freeIcon from "../assets/freeIcon.png";
import freeNoSelected from "../assets/freeNoSelected.png";
import RefreshIcon from "@mui/icons-material/Refresh";
import moneyGray from "../assets/moneyGray.png";
import moneyGold from "../assets/moneyGold.png";
import carenda from "../assets/calendar.png";

import save from "../assets/saveNew.png";
import { useNavigate } from "react-router-dom";

export default function SelectPage() {
  const navigate = useNavigate();

  localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
    navigate("/login");
  };
  return (
    <ThemeProvider theme={theme3}>
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
        <Box>
          <Grid container spacing={2}>
            <Grid size={4}></Grid>
            <Grid size={4} className="grid-select-header">
                <Typography className="text-select-header">
                    Select Page
                </Typography>
            </Grid>
            <Grid size={4} className="grid-select-header">
              <Button
                variant="outlined"
                color="error"
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box className="box-all-box-selected">
          <Box className="header-selected">
            <Box className="box-btn-gallery">
              <Button
                className="go-report-btn"
                onClick={() => navigate("/report")}
              >
                <Typography className="text-btn">report</Typography>
              </Button>
            </Box>
            <Box className="box-btn-gallery">
              <Button
                className="go-report-btn"
                onClick={() => navigate("/gallery/filter")}
              >
                <Typography className="text-btn">gallery</Typography>
              </Button>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bottom: "2.6vh"
            // marginBottom: "8px"
            // padding: "32px",
            // backgroundColor: "transparent",
          }}
        >
          <Typography
            color="black"
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
