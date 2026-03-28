import { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import MonitorIcon from "@mui/icons-material/Monitor";
import { useNavigate } from "react-router-dom";
import { api } from "../controller/client";
import { theme3 } from "../assets/theme";

export default function MachinesPage() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const loadMachines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/photobooths/machines");
      setMachines(res.data.machines || []);
    } catch (err) {
      showToast("Failed to load machines", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  const handleCleanDead = async () => {
    setHealthLoading(true);
    try {
      const res = await api.post("/photobooths/machines/health");
      setMachines(res.data.machines || []);
      showToast(`Cleaned ${res.data.removed || 0} dead machine(s)`);
    } catch (err) {
      showToast("Health check failed", "error");
    } finally {
      setHealthLoading(false);
    }
  };

  const handleRemove = async (machine) => {
    const id = machine.id || encodeURIComponent(machine.tunnelUrl);
    try {
      await api.delete(`/photobooths/register/${encodeURIComponent(id)}`);
      showToast(`Removed ${machine.nickname}`);
      loadMachines();
    } catch (err) {
      showToast("Failed to remove machine", "error");
    }
  };

  const handleRemoveAll = async () => {
    if (!window.confirm("Remove ALL machines? They will re-register if still running.")) return;
    try {
      await api.delete("/photobooths/register");
      showToast("All machines removed");
      loadMachines();
    } catch (err) {
      showToast("Failed to remove all", "error");
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link copied!");
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <ThemeProvider theme={theme3}>
      <CssBaseline enableColorScheme />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={() => navigate("/selectPage")}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight={700}>
              Machines
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadMachines}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={healthLoading ? <CircularProgress size={18} /> : <HealthAndSafetyIcon />}
              onClick={handleCleanDead}
              disabled={healthLoading}
            >
              Clean Dead
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleRemoveAll}
              disabled={machines.length === 0}
            >
              Remove All
            </Button>
            <Button variant="outlined" color="error" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>

        {/* Machine list */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : machines.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, color: "#888" }}>
            <MonitorIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
            <Typography variant="h6">No active machines</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Start a photobooth to see it here
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {machines.map((machine, idx) => {
              const galleryUrl = machine.tunnelUrl + "/#/gallery";
              const ips = (machine.ips || []).join(", ") || "—";
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={machine.id || idx}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 12, color: "success.main" }} />
                        <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1 }}>
                          {machine.nickname}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ bgcolor: "action.hover", px: 1, borderRadius: 1 }}
                        >
                          {ips}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ wordBreak: "break-all", lineHeight: 1.4 }}
                      >
                        {machine.tunnelUrl}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2, gap: 0.5 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        href={galleryUrl}
                        target="_blank"
                        rel="noopener"
                      >
                        Open
                      </Button>
                      <Tooltip title="Copy gallery link">
                        <IconButton size="small" onClick={() => handleCopy(galleryUrl)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove machine">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemove(machine)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Footer */}
        <Box sx={{ textAlign: "center", mt: 4, color: "#aaa" }}>
          <Typography variant="caption">
            Sixsheet Photobooth &copy; {new Date().getFullYear()}
          </Typography>
        </Box>

        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}
