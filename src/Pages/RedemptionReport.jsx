import { useState, useEffect, useRef, useCallback } from "react";
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
  Pagination,
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

const PAGE_SIZE = 50;

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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    totalRedemptions: 0,
    uniqueUsers: 0,
    totalPointsUsed: 0,
    topOffers: [],
  });

  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);

  const buildBody = useCallback(() => {
    const offerCodeList = offerCodeInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      selectedStart,
      selectedEnd,
      phoneNo: phoneNo || undefined,
      offerCode: offerCodeList.length > 0 ? offerCodeList : undefined,
    };
  }, [selectedStart, selectedEnd, phoneNo, offerCodeInput]);

  const handleSelect = (item) => {
    if (!item?.selection) return;
    setRanges([item.selection]);
    setSelectedStart(dayjs(item.selection.startDate).format("YYYY-MM-DD"));
    setSelectedEnd(dayjs(item.selection.endDate).format("YYYY-MM-DD"));
  };

  const fetchSummary = useCallback(
    async (body) => {
      try {
        const { data } = await api.post(
          "/report/redemption/summary",
          body,
        );
        if (data?.success && data.data) {
          setSummary(data.data);
        }
      } catch (err) {
        throw err;
      }
    },
    [],
  );

  const fetchList = useCallback(
    async (body, pageNumber) => {
      const offset = (pageNumber - 1) * PAGE_SIZE;
      const { data } = await api.post("/report/redemption/list", {
        ...body,
        offset,
        limit: PAGE_SIZE,
      });
      if (data?.success && data.data) {
        setRows(data.data.rows || []);
        setTotalRows(data.data.count || 0);
      }
    },
    [],
  );

  const refresh = useCallback(
    async (pageNumber = 1) => {
      setLoading(true);
      setError("");
      const body = buildBody();
      try {
        await Promise.all([fetchSummary(body), fetchList(body, pageNumber)]);
        setPage(pageNumber);
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load redemption data";
        setError(String(msg));
      } finally {
        setLoading(false);
      }
    },
    [buildBody, fetchSummary, fetchList],
  );

  useEffect(() => {
    refresh(1);
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

  const handlePageChange = (_e, value) => {
    refresh(value);
  };

  const clearFilters = () => {
    setPhoneNo("");
    setOfferCodeInput("");
    setSelectedStart(null);
    setSelectedEnd(null);
    setRanges([
      { startDate: new Date(), endDate: new Date(), key: "selection" },
    ]);
  };

  const exportExcel = async () => {
    setExporting(true);
    setError("");
    try {
      const body = buildBody();
      const response = await api.post(
        "/report/redemption/download",
        body,
        { responseType: "blob" },
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `redemption-report-${dayjs().format("YYYYMMDD-HHmmss")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || "Excel export failed");
    } finally {
      setExporting(false);
    }
  };

  const dateLabel =
    selectedStart && selectedEnd
      ? `${selectedStart}  ~  ${selectedEnd}`
      : "All time";

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

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
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={4} sm={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => refresh(1)}
                disabled={loading}
              >
                Apply
              </Button>
            </Grid>
            <Grid item xs={4} sm={1}>
              <Button fullWidth variant="text" onClick={clearFilters}>
                Clear
              </Button>
            </Grid>
            <Grid item xs={4} sm={1}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={exportExcel}
                disabled={exporting || loading}
              >
                {exporting ? "..." : "Excel"}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Paper
            sx={{ p: 2, mb: 2, backgroundColor: "#fee", color: "#900" }}
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

            <Paper sx={{ p: 2, mb: 3 }}>
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

            <Paper sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Redemption Details</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatNumber(totalRows)} record(s)
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Redeemed At</TableCell>
                      <TableCell>Phone No.</TableCell>
                      <TableCell>Line ID</TableCell>
                      <TableCell>Offer Code</TableCell>
                      <TableCell>Offer Reference</TableCell>
                      <TableCell align="right">Points Used</TableCell>
                      <TableCell>Valid Until</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.uuid}>
                          <TableCell>{row.createdAt ?? "-"}</TableCell>
                          <TableCell>{row.phoneNo ?? "-"}</TableCell>
                          <TableCell>{row.lineId ?? "-"}</TableCell>
                          <TableCell>{row.offerCode ?? "-"}</TableCell>
                          <TableCell>{row.offerReference ?? "-"}</TableCell>
                          <TableCell align="right">
                            {row.pointUsage != null
                              ? Number(row.pointUsage).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>{row.validUntil ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box
                sx={{ display: "flex", justifyContent: "center", mt: 2 }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            </Paper>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default RedemptionReport;
