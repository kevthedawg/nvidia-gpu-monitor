import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import { GpuDashboard } from "./components/GpuDashboard";
import { theme } from "./theme";

export const App = (): React.ReactElement => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          {"GPU Monitor"}
        </Typography>
        <GpuDashboard />
      </Container>
    </ThemeProvider>
  );
};
