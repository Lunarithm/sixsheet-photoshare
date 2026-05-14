import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Card,
  CardContent,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import { theme3 } from "../assets/theme";
import dayjs from "dayjs";
import ClipLoader from "react-spinners/ClipLoader";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRangePicker } from "react-date-range";
import { useNavigate } from "react-router-dom";
import { api } from "../controller/client";

const formatNumber = (n) =>
  typeof n === "number" ? n.toLocaleString("en-US") : "0";

function RedemptionReport() {
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  const [phoneNo, setPhoneNo] = useState("");
  const [offerCodeInput, setOfferCodeInput] = useState("");
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [ranges, setRanges] = useState([
    { startDate: new Date(), endDate: new Date(), key: "selection" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    totalRedemptions: 0,
    uniqueUsers: 0,
    totalPointsUsed: 0,
    topOffers: [],
  });

  const handleSelect = (item) => {
    if (!item?.selection) return;
    setRanges([item.selection]);
    setSelectedStart(
      dayjs(item.selection.startDate).format("YYYY-MM-DD"),
    );
    setSelectedEnd(dayjs(item.selection.endDate).format("YYYY-MM-DD"));
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const offerCodeList = offerCodeInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { data } = await api.post("/report/redemption/summary", {
        selectedStart,
        selectedEnd,
        phoneNo: phoneNo || undefined,
        offerCode: offerCodeList.length > 0 ? offerCodeList : undefined,
      });

      if (data?.success && data.data) {
        setSummary(data.data);
      } else {
        setError("Unexpected response from server");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load redemption summary";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target)
      ) {
        setOpenCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearFilters = () => {
    setPhoneNo("");
    setOfferCodeInput("");
    setSelectedStart(null);
    setSelectedEnd(null);
    setRanges([{ startDate: new Date(), endDate: new Date(), key: "selection" }]);
  };

  const dateLabel =
    selectedStart && selectedEnd
      ? `${selectedStart}  ~  ${selectedEnd}`
      : "All time";

  return (
    <ThemeProvider theme={theme3}>
      <CssBaseline enableColorScheme />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button onClick={() => navigate("/selectPage")} variant="outlined">
            Back
          </Button>
          <Typography variant="h4" sx={{ flex: 1, textAlign: "center" }}>
            User Redemption Report
          </Typography>
          <Box sx={{ width: 80 }} />
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Phone number"
                value={phoneNo}
                onChange={(e) => setPhoneNo(e.target.value)}
                placeholder="partial match"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Offer codes (comma-separated)"
                value={offerCodeInput}
                onChange={(e) => setOfferCodeInput(e.target.value)}
                placeholder="OFFER1, OFFER2"
              />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ position: "relative" }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setOpenCalendar((v) => !v)}
              >
                {dateLabel}
              </Button>
              {openCalendar && (
                <Box
                  ref={calendarRef}
                  sx={{
                    position: "absolute",
                    zIndex: 10,
                    top: "100%",
                    left: 0,
                    mt: 1,
                    boxShadow: 3,
                  }}
                >
                  <DateRangePicker
                    ranges={ranges}
                    onChange={handleSelect}
                    moveRangeOnFirstSelection={false}
                    months={1}
                    direction="horizontal"
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={6} sm={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={fetchSummary}
                disabled={loading}
              >
                Apply
              </Button>
            </Grid>
            <Grid item xs={6} sm={1}>
              <Button fullWidth variant="text" onClick={clearFilters}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Paper
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: "#fee",
              color: "#900",
            }}
          >
            {error}
          </Paper>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <ClipLoader />
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">
                      Total Redemptions
                    </Typography>
                    <Typography variant="h3">
                      {formatNumber(summary.totalRedemptions)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">
                      Unique Users
                    </Typography>
                    <Typography variant="h3">
                      {formatNumber(summary.uniqueUsers)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">
                      Total Points Used
                    </Typography>
                    <Typography variant="h3">
                      {formatNumber(summary.totalPointsUsed)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top Offers
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Offer Code</TableCell>
                      <TableCell align="right">Redemptions</TableCell>
                      <TableCell align="right">Points Used</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.topOffers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      summary.topOffers.map((row, idx) => (
                        <TableRow key={`${row.offerCode ?? "null"}-${idx}`}>
                          <TableCell>{row.offerCode ?? "(none)"}</TableCell>
                          <TableCell align="right">
                            {formatNumber(row.count)}
                          </TableCell>
                          <TableCell align="right">
                            {formatNumber(row.pointsUsed)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default RedemptionReport;
