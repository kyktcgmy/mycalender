"use client";

import { v4 as uuidv4 } from "uuid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventEditor from "./EventEditor";
import { CalendarEvent } from "@/types/event";

type Props = {
  events: CalendarEvent[];
  onChange: (events: CalendarEvent[]) => void;
};

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function EventList({ events, onChange }: Props) {
  function handleChange(updated: CalendarEvent) {
    onChange(events.map((e) => (e.id === updated.id ? updated : e)));
  }

  function handleDelete(id: string) {
    onChange(events.filter((e) => e.id !== id));
  }

  function handleAdd() {
    const newEvent: CalendarEvent = {
      id: uuidv4(),
      date: today(),
      title: "",
      memo: "",
    };
    onChange([...events, newEvent]);
  }

  return (
    <Box>
      {events.length === 0 ? (
        // 空状態
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 6,
            color: "text.secondary",
          }}
        >
          <CalendarMonthIcon sx={{ fontSize: 56, opacity: 0.3 }} />
          <Typography variant="body1">
            イベントがありません
          </Typography>
          <Typography variant="body2" color="text.disabled">
            「イベントを追加」ボタンで手動追加できます
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {events.map((event) => (
            <EventEditor
              key={event.id}
              event={event}
              onChange={handleChange}
              onDelete={handleDelete}
            />
          ))}
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          fullWidth
        >
          イベントを追加
        </Button>
      </Box>
    </Box>
  );
}
