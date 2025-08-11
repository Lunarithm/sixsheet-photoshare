import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from "@mui/material";


export default function GalleryHome({ onSelect, apiUrl = "/api/machines/machineNos" }) {
  const [groups, setGroups] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onSelectDefault = (machineNo) => {
    navigate("/gallery/result", {
      state: { machineNos: [machineNo] } // pass as prop in location.state
    });
  }


  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_APIHUB_URL}/media/fetch/machine/list`, { headers: { "Content-Type": "application/json" } });
        // data shape: [{ machineNo, machineName, count }, ...]
        if (!mounted) return;

        // Group by machineNo
        const map = new Map();
        for (const row of data || []) {
          const key = String(row.machineNo || "").trim();
          if (!key) continue;
          const entry = map.get(key) || { machineNo: key, totalCount: 0, names: [] };
          entry.totalCount += Number(row.count || 0);
          const nm = row.machineName?.trim();
          if (nm && !entry.names.includes(nm)) entry.names.push(nm);
          map.set(key, entry);
        }

        // Sort by numeric machineNo if possible, else lexicographic
        const list = Array.from(map.values()).sort((a, b) => {
          const na = parseInt(a.machineNo, 10);
          const nb = parseInt(b.machineNo, 10);
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
          return a.machineNo.localeCompare(b.machineNo);
        });

        setGroups(list);
      } catch (e) {
        setError(e?.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.machineNo.toLowerCase().includes(q) ||
        g.names.some((n) => n.toLowerCase().includes(q))
    );
  }, [groups, query]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Select a Machine
        </Typography>
        <TextField
          size="small"
          placeholder="Search machine no or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Stack>

      <Grid container spacing={2}>
        {filtered.map((m) => {
          const topNames = m.names.slice(0, 2);
          const extraCount = Math.max(0, m.names.length - 2);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={m.machineNo}>
              <Card elevation={3} sx={{ borderRadius: 3, height: "100%" }}>
                <CardActionArea onClick={() => onSelectDefault(m.machineNo)} sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">#{m.machineNo}</Typography>
                      <Chip label={`${m.totalCount.toLocaleString()} runs`} />
                    </Stack>

                    <Box mt={1.5}>
                      <Typography variant="caption" color="text.secondary">
                        Machine names
                      </Typography>

                      <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {topNames.map((n) => (
                          <Chip key={n} label={n} size="small" variant="outlined" />
                        ))}
                        {extraCount > 0 && (
                          <Tooltip
                            title={
                              <Box>
                                {m.names.map((n) => (
                                  <div key={n}>{n}</div>
                                ))}
                              </Box>
                            }
                            arrow
                          >
                            <Chip size="small" label={`+${extraCount} more`} />
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: "center", color: "text.secondary", mt: 6 }}>
          <Typography>No machines match “{query}”.</Typography>
        </Box>
      )}
    </Box>
  );
}