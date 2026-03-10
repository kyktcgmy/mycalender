"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1a73e8", // Google Blue
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ea4335", // Google Red
      contrastText: "#ffffff",
    },
  },
  typography: {
    fontFamily: "var(--font-roboto)",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          minHeight: 44, // モバイルのタップ領域確保
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
  },
});

export default theme;
