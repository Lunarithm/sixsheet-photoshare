import { useState } from "react";
import {
  Alert, Box, Button, Checkbox, Container, FormControlLabel, IconButton,
  InputAdornment, TextField, Typography, CircularProgress, Paper
} from "@mui/material";
import { Visibility, VisibilityOff, Login as LoginIcon } from "@mui/icons-material";
import { api } from "../controller/client";
import { useNavigate } from "react-router-dom";

const extractBearer = (value) => {
  if (!value) return null;
  const parts = String(value).split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return null;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg("Please provide both username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/users/login", { username, password });

      // Server must expose this header via CORS: exposedHeaders: ["Authorization"]
      const token = res.data.data.token;

      if (!token) {
        setErrorMsg("Login succeeded but token was not provided.");
        return;
      }

      if (remember) localStorage.setItem("access_token", token);
      else sessionStorage.setItem("access_token", token);

      // Optionally store user from your ApiSuccess body
      const user = res.data?.data || res.data?.user;
      if (user) localStorage.setItem("user", JSON.stringify(user));

      navigate("/gallery/filter");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) setErrorMsg("Username and password are required.");
      else if (status === 401) setErrorMsg("Invalid credentials.");
      else setErrorMsg("Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <Paper elevation={6} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your credentials to access the dashboard.
          </Typography>

          {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            fullWidth
            margin="normal"
            required
          />

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <FormControlLabel
              control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
              label="Remember me"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 2 }}
            startIcon={!loading ? <LoginIcon /> : undefined}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Sign in"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}