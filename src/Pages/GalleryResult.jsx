// src/pages/MachineResultsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const API_URL = "/api/machines/grouped"; // Your POST endpoint
const PHOTOSHARE_BASE = "https://sixsheet-photoshare-3tu92.ondigitalocean.app/";

// -------- helpers --------

// Convert "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DD HH:mm:ss" for backend
function toBackendDate(dtLocal) {
  if (!dtLocal) return "";
  const [d, t] = dtLocal.split("T");
  if (!d || !t) return "";
  return `${d} ${t.length >= 8 ? t : `${t}:00`}`;
}

// Get first .jpg from source array
function getJpgFromSource(sourceArr) {
  if (!Array.isArray(sourceArr)) return "";
  const jpg = sourceArr.find((s) =>
    String(s?.name || "").toLowerCase().endsWith(".jpg")
  );
  return jpg?.path || "";
}

export default function MachineResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

// 1) Initialize once (from location.state or sessionStorage)
const [machineNos, setMachineNos] = React.useState(() => {
  const fromNav = location.state?.machineNos;
  if (Array.isArray(fromNav) && fromNav.length) {
    sessionStorage.setItem("machineNos", JSON.stringify(fromNav));
    return fromNav;
  }
  const cached = sessionStorage.getItem("machineNos");
  return cached ? JSON.parse(cached) : [];
});

  // ---- query params (pagination) ----
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromQuery = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limitFromQuery = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

  // ---- local state ----
  const [startInput, setStartInput] = useState(""); // datetime-local
  const [endInput, setEndInput] = useState("");
  const [limit, setLimit] = useState(limitFromQuery);
  const [page, setPage] = useState(pageFromQuery - 1); // MUI-style 0-based

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [counts, setCounts] = useState([]);     // [{ machineNo, count }]
  const [records, setRecords] = useState([]);   // [{ uuid, source[], event, createdAt, ... }]
  const [totalRecords, setTotalRecords] = useState(0);

  // Sync local page/limit when URL query changes (e.g., user pastes a URL)
  useEffect(() => {
    const qp = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const ql = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    setPage(qp - 1);
    setLimit(ql);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // if no selection, go back to picker
  useEffect(() => {
    if (!machineNos.length) {
      navigate("/gallery/filter", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(machineNos)]);

  const offset = useMemo(() => page * limit, [page, limit]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const body = {
        machineNo: machineNos, // <--- send as body parameter (array)
        startDate: startInput ? toBackendDate(startInput) : undefined,
        endDate: endInput ? toBackendDate(endInput) : undefined,
        dateField: "createdAt",
        offset,
        limit,
      };

   const { data } = await axios.post(`${import.meta.env.VITE_APIHUB_URL}/media/fetch/machine`, body, {
        headers: { "Content-Type": "application/json" },
      });

      setCounts(Array.isArray(data?.counts) ? data.counts : []);
      setRecords(Array.isArray(data?.records) ? data.records : []);
      setTotalRecords(Number(data?.pagination?.totalRecords || 0));
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  // Reset to first page when filters change and update URL
  const resetToFirstPageAndFetch = () => {
    setPage(0);
    const next = new URLSearchParams(searchParams);
    next.set("page", "1");              // store 1-based in URL
    next.set("limit", String(limit));
    setSearchParams(next, { replace: false });
    fetchData();
  };

  // Change page helper (keeps URL in sync)
  const goToPage = (nextZeroBased) => {
    const totalPages = Math.max(1, Math.ceil(totalRecords / Math.max(1, limit)));
    const clamped = Math.min(Math.max(0, nextZeroBased), totalPages - 1);
    setPage(clamped);
    const next = new URLSearchParams(searchParams);
    next.set("page", String(clamped + 1));
    next.set("limit", String(limit));
    setSearchParams(next, { replace: false });
  };

  // Change rows per page (resets to page 1)
  const handleChangeRowsPerPage = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setPage(0);
    const next = new URLSearchParams(searchParams);
    next.set("page", "1");
    next.set("limit", String(newLimit));
    setSearchParams(next, { replace: false });
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, startInput, endInput, JSON.stringify(machineNos)]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / Math.max(1, limit)));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" gap={1} mb={2}>
        <IconButton onClick={() => navigate(-1)} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Machine Results
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          {machineNos.map((m) => (
            <Chip key={m} label={`#${m}`} />
          ))}
        </Stack>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 2, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Start Date"
                type="datetime-local"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="End Date"
                type="datetime-local"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={resetToFirstPageAndFetch}
                  disabled={loading}
                >
                  Apply
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Rows:
                </Typography>
                <Select
                  size="small"
                  value={limit}
                  onChange={handleChangeRowsPerPage}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary chips: machineNo + count */}
      <Card sx={{ mb: 2, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Summary
          </Typography>
          {counts.length ? (
            <Stack direction="row" gap={1} flexWrap="wrap">
              {counts.map((c) => (
                <Chip
                  key={c.machineNo}
                  label={`#${c.machineNo}: ${Number(c.count).toLocaleString()}`}
                />
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">No summary available.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Records as cards (CardMedia uses first .jpg in source) */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="subtitle1">Records</Typography>
            {loading && <CircularProgress size={24} />}
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {error ? (
            <Typography color="error">Error: {error}</Typography>
          ) : (
            <>
              <Grid container spacing={2}>
                {records.map((r) => {
                  const imgUrl = getJpgFromSource(r.source);
                  const mNo = r?.event?.machineNo || "";
                  const mName = r?.event?.machineName || "";
                  const createdAt = r?.createdAt
                    ? new Date(r.createdAt).toLocaleString()
                    : "-";
                  const url = `${import.meta.env.VITE_PHOTOSHARE}/media/${r.shortUUID || ""}`;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={r.uuid}>
                      <Card
                        elevation={3}
                        sx={{
                          borderRadius: 3,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <CardActionArea
                          onClick={() => {
                            if (r.shortUUID) {
                              window.open(url, "_blank", "noopener,noreferrer");
                            }
                          }}
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                          }}
                        >
                          {imgUrl ? (
                            <CardMedia
                              component="img"
                              height="180"
                              image={imgUrl}
                              alt={r.source?.[0]?.name || "record"}
                              loading="lazy"
                            />
                          ) : (
                            <Box
                              sx={{
                                height: 180,
                                background:
                                  "linear-gradient(135deg, rgba(0,0,0,0.08), rgba(0,0,0,0.02))",
                              }}
                            />
                          )}
                          <CardContent sx={{ flexGrow: 1, width: "100%" }}>
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle1" noWrap>
                                #{mNo} {mName ? `• ${mName}` : ""}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {createdAt}
                              </Typography>
                            </Stack>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}

                {!loading && records.length === 0 && (
                  <Grid item xs={12}>
                    <Typography align="center" color="text.secondary">
                      No records found.
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Pagination (query-synced) */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Page {totalRecords ? page + 1 : 0} of {totalPages}
                </Typography>
                <Stack direction="row" gap={1}>
                  <Button
                    variant="outlined"
                    disabled={page === 0 || loading}
                    onClick={() => goToPage(page - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={page + 1 >= totalPages || loading}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                  </Button>
                </Stack>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
