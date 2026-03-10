"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import { CalendarEvent } from "@/types/event";

type Props = {
  event: CalendarEvent;
  onChange: (updated: CalendarEvent) => void;
  onDelete: (id: string) => void;
};

export default function EventEditor({ event, onChange, onDelete }: Props) {
  function handleChange(field: keyof CalendarEvent, value: string) {
    onChange({ ...event, [field]: value });
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <TextField
              label="日付"
              type="date"
              value={event.date}
              onChange={(e) => handleChange("date", e.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <TextField
              label="タイトル"
              value={event.title}
              onChange={(e) => handleChange("title", e.target.value)}
              size="small"
              fullWidth
              required
            />
            <TextField
              label="メモ"
              value={event.memo}
              onChange={(e) => handleChange("memo", e.target.value)}
              size="small"
              fullWidth
              multiline
              minRows={2}
              placeholder="メモ（任意）"
            />
          </Box>

          <Tooltip title="このイベントを削除">
            <IconButton
              aria-label="イベントを削除"
              color="error"
              onClick={() => onDelete(event.id)}
              sx={{ mt: 0.5 }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}
