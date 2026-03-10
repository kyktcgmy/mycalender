"use client";

import { useEffect, useState } from "react";
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
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DownloadIcon from "@mui/icons-material/Download";
import EventList from "@/components/EventList";
import { CalendarEvent } from "@/types/event";

const SESSION_KEY = "mycalender_events";

export default function ConfirmPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        setEvents(JSON.parse(raw));
      } catch {
        setError("イベントデータの読み込みに失敗しました。最初からやり直してください。");
      }
    }
  }, []);

  // events が変わるたびに sessionStorage を同期
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(events));
  }, [events]);

  async function handleDownload() {
    if (events.length === 0) return;

    setDownloading(true);
    setError(null);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `サーバーエラー (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "calendar.ics";
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : ".ics ファイルの生成に失敗しました。");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="戻る"
            onClick={() => router.push("/")}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <CalendarMonthIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="h1" fontWeight={600}>
            mycalender
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" component="h2" fontWeight={500} gutterBottom>
          イベントを確認・編集
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          OCR で読み取ったイベントを確認し、必要に応じて修正してください。
          問題なければ .ics ファイルをダウンロードして Google カレンダーにインポートできます。
        </Typography>

        <EventList events={events} onChange={setEvents} />

        <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={events.length === 0 || downloading}
            onClick={handleDownload}
            startIcon={
              downloading
                ? <CircularProgress size={20} color="inherit" />
                : <DownloadIcon />
            }
          >
            {downloading ? "生成中…" : ".ics ファイルをダウンロード"}
          </Button>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={() => router.push("/")}
          >
            戻る
          </Button>
        </Box>
      </Container>

      {/* 成功メッセージ */}
      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccess(false)}
          sx={{ width: "100%" }}
        >
          .ics ファイルのダウンロードが完了しました。Google カレンダーにインポートしてください。
        </Alert>
      </Snackbar>

      {/* エラーメッセージ */}
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
