"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ImageUploader from "@/components/ImageUploader";
import { CalendarEvent } from "@/types/event";

const SESSION_KEY = "mycalender_events";

export default function HomePage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOcr() {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `サーバーエラー (${res.status})`);
      }

      const events: CalendarEvent[] = data.events;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(events));
      router.push("/confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR 処理に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <CalendarMonthIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="h1" fontWeight={600}>
            mycalender
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" component="h2" fontWeight={500} gutterBottom>
          カレンダー画像をアップロード
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          手書きカレンダーや Google カレンダーのスクリーンショットをアップロードすると、
          OCR でスケジュールを読み取り .ics ファイルに変換します。
        </Typography>

        <ImageUploader onFileSelect={setSelectedFile} />

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={!selectedFile || loading}
            onClick={handleOcr}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : undefined
            }
          >
            {loading ? "OCR 処理中…" : "OCR 処理開始"}
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={!!error}
        autoHideDuration={8000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setError(null)}
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
