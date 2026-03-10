"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ImageIcon from "@mui/icons-material/Image";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.pdf";

type Props = {
  onFileSelect: (file: File) => void;
};

export default function ImageUploader({ onFileSelect }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return `対応していないファイル形式です（${file.type}）。JPEG・PNG・PDF を選択してください。`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `ファイルサイズが上限（10MB）を超えています（${(file.size / 1024 / 1024).toFixed(1)}MB）。`;
    }
    return null;
  }

  function handleFile(file: File) {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFileName(file.name);
    onFileSelect(file);

    // PDF はプレビューできないため名前だけ表示
    if (file.type === "application/pdf") {
      setPreviewUrl(null);
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // 同じファイルを再選択できるようにリセット
    e.target.value = "";
  }

  return (
    <Box>
      {/* 隠しファイル入力（ファイル選択用） */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS}
        style={{ display: "none" }}
        onChange={handleInputChange}
      />
      {/* 隠しファイル入力（カメラ撮影用） */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleInputChange}
      />

      {/* ボタン群 */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          ファイルを選択
        </Button>

        {isMobile && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CameraAltIcon />}
            onClick={() => cameraInputRef.current?.click()}
          >
            カメラで撮影
          </Button>
        )}
      </Box>

      {/* プレビュー */}
      {(previewUrl || fileName) && (
        <Box
          sx={{
            mt: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            maxWidth: 480,
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="プレビュー"
              style={{ width: "100%", display: "block", maxHeight: 320, objectFit: "contain" }}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 2,
                bgcolor: "grey.50",
              }}
            >
              <ImageIcon color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {fileName}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* エラー Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
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
    </Box>
  );
}
