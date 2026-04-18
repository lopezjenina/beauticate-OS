'use client';

import { useState, useMemo } from 'react';
import { Badge, Btn, PageHeader } from '@/components/ui';
import { Client, Video } from '@/lib/types';
import { AppUser } from '@/lib/auth';

interface CalendarPageProps {
  clients?: Client[];
  videos?: Video[];
  users?: AppUser[];
}

export default function CalendarPage({
  clients = [],
  videos = [],
  users = [],
}: CalendarPageProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay();
  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map shoot dates to events
  const events = useMemo(() => {
    const map: Record<number, { client: string; type: string; color: string }[]> = {};

    clients.forEach(c => {
      if (c.shootDate) {
        const d = new Date(c.shootDate);
        if (d.getMonth() === currentMonth.month && d.getFullYear() === currentMonth.year) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          map[day].push({ client: c.name, type: "shoot", color: "#2383E2" });
        }
      }
    });

    videos.forEach(v => {
      if (v.dueDate) {
        const d = new Date(v.dueDate);
        if (d.getMonth() === currentMonth.month && d.getFullYear() === currentMonth.year) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          const clientName = clients.find(c => c.id === v.clientId)?.name || "Unknown";
          map[day].push({ client: clientName, type: "due", color: "#EB5757" });
        }
      }
      if (v.scheduledDate) {
        const d = new Date(v.scheduledDate);
        if (d.getMonth() === currentMonth.month && d.getFullYear() === currentMonth.year) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          const clientName = clients.find(c => c.id === v.clientId)?.name || "Unknown";
          map[day].push({ client: clientName, type: "publish", color: "#4DAB9A" });
        }
      }
    });

    return map;
  }, [clients, videos, currentMonth]);

  const prevMonth = () => {
    setSelectedDay(null);
    setCurrentMonth(prev => prev.month === 0
      ? { year: prev.year - 1, month: 11 }
      : { year: prev.year, month: prev.month - 1 }
    );
  };

  const nextMonth = () => {
    setSelectedDay(null);
    setCurrentMonth(prev => prev.month === 11
      ? { year: prev.year + 1, month: 0 }
      : { year: prev.year, month: prev.month + 1 }
    );
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === currentMonth.month && today.getFullYear() === currentMonth.year;

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div style={{ padding: '40px' }}>
      <PageHeader title="Calendar" subtitle="Shoot schedule and deadlines at a glance">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn onClick={prevMonth}>&larr;</Btn>
          <span style={{ fontSize: 15, fontWeight: 600, minWidth: 160, textAlign: "center" }}>{monthName}</span>
          <Btn onClick={nextMonth}>&rarr;</Btn>
        </div>
      </PageHeader>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, fontSize: 12, color: "#6B6B6B" }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2383E2", marginRight: 6 }}></span>Shoot</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#EB5757", marginRight: 6 }}></span>Due Date</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4DAB9A", marginRight: 6 }}></span>Publish</span>
      </div>

      {/* Calendar Grid */}
      <div style={{ border: "1px solid #E3E3E0", borderRadius: 8, overflow: "hidden" }}>
        {/* Weekday headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #E3E3E0", background: "#F7F7F5" }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ padding: "10px 8px", fontSize: 11, fontWeight: 600, color: "#6B6B6B", textAlign: "center", textTransform: "uppercase" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: 90, borderRight: "1px solid #EBEBEA", borderBottom: "1px solid #EBEBEA", background: "#FAFAFA" }} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = events[day] || [];
            return (
              <div key={day}
                onClick={() => { if (dayEvents.length > 0) setSelectedDay(day); }}
                onMouseEnter={() => { if (dayEvents.length > 0) setHoveredDay(day); }}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                minHeight: 90, padding: "6px 8px",
                borderRight: "1px solid #EBEBEA", borderBottom: "1px solid #EBEBEA",
                background: isToday(day) ? "#E8F0FE" : (dayEvents.length > 0 && hoveredDay === day) ? "#F7F7F5" : "#FFF",
                cursor: dayEvents.length > 0 ? "pointer" : "default",
                transition: "background 0.15s",
              }}>
                <div style={{
                  fontSize: 12, fontWeight: isToday(day) ? 700 : 400,
                  color: isToday(day) ? "#2383E2" : "#1A1A1A", marginBottom: 4,
                }}>
                  {day}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <div key={j} style={{
                      fontSize: 10, padding: "2px 4px", borderRadius: 3,
                      background: ev.color + "18", color: ev.color,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {ev.client}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: 10, color: "#9B9B9B" }}>+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && events[selectedDay] && (
        <div style={{ marginTop: 24, border: "1px solid #E3E3E0", borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              {monthName.split(' ')[0]} {selectedDay} Events
            </h3>
            <button onClick={() => setSelectedDay(null)} style={{ border: "none", background: "transparent", color: "#9B9B9B", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events[selectedDay].map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F7F7F5", borderRadius: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{ev.client}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B" }}>{ev.type === "shoot" ? "Shoot Day" : ev.type === "due" ? "Due Date" : "Publish Date"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
