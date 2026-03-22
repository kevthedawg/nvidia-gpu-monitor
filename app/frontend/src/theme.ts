import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#76b900", // NVIDIA green
    },
    background: {
      default: "#0a0a0a",
      paper: "#141414",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        },
      },
    },
  },
});
