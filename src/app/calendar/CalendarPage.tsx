'use client';

import { useState, useMemo, useEffect } from 'react';
import { Badge, Btn, PageHeader } from '@/components/ui';
import { fetchContent, ContentPipeline } from '@/lib/db';

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [contents, setContents] = useState<ContentPipeline[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    fetchContent().then(setContents);
  }, []);

  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay();
  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map scheduled_date to events
  const events = useMemo(() => {
    const map: Record<number, { title: string; type: string; status: string; color: string }[]> = {};

    contents.forEach(c => {
      if (c.scheduledDate) {
        const d = new Date(c.scheduledDate);
        if (d.getMonth() === currentMonth.month && d.getFullYear() === currentMonth.year) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          let color = "#1A1A1A"; // default
          if (c.status === "published") color = "#4DAB9A";
          else if (c.status === "staged" || c.status === "pending_approval") color = "#CB7F2C";
          else if (c.status === "approved") color = "#2383E2";

          map[day].push({ title: c.title, type: c.type, status: c.status, color });
        }
      }
    });

    return map;
  }, [contents, currentMonth]);

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
      <PageHeader title="Content Calendar" subtitle="Scheduled and published content">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn onClick={prevMonth}>&larr;</Btn>
          <span style={{ fontSize: 15, fontWeight: 600, minWidth: 160, textAlign: "center" }}>{monthName}</span>
          <Btn onClick={nextMonth}>&rarr;</Btn>
        </div>
      </PageHeader>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, fontSize: 12, color: "#6B6B6B" }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4DAB9A", marginRight: 6 }}></span>Published</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2383E2", marginRight: 6 }}></span>Approved (Ready)</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#CB7F2C", marginRight: 6 }}></span>In Progress</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#1A1A1A", marginRight: 6 }}></span>Draft</span>
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
            <div key={`empty-${i}`} style={{ minHeight: 110, borderRight: "1px solid #EBEBEA", borderBottom: "1px solid #EBEBEA", background: "#FAFAFA" }} />
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
                minHeight: 110, padding: "8px", display: "flex", flexDirection: "column",
                borderRight: "1px solid #EBEBEA", borderBottom: "1px solid #EBEBEA",
                background: isToday(day) ? "#EAF5F2" : (dayEvents.length > 0 && hoveredDay === day) ? "#F7F7F5" : "#FFF",
                cursor: dayEvents.length > 0 ? "pointer" : "default",
                transition: "background 0.15s",
              }}>
                <div style={{
                  fontSize: 12, fontWeight: isToday(day) ? 700 : 500,
                  color: isToday(day) ? "#4DAB9A" : "#1A1A1A", marginBottom: 6,
                }}>
                  {day}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <div key={j} style={{
                      fontSize: 10, padding: "3px 6px", borderRadius: 4,
                      background: ev.color + "1A", color: ev.color, fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", border: `1px solid ${ev.color}33`,
                    }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, paddingLeft: 4 }}>+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && events[selectedDay] && (
        <div style={{ marginTop: 24, border: "1px solid #E3E3E0", borderRadius: 8, padding: 20, background: "#FFF", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              {monthName.split(' ')[0]} {selectedDay} Schedule
            </h3>
            <button onClick={() => setSelectedDay(null)} style={{ border: "none", background: "transparent", color: "#9B9B9B", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>&times;</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events[selectedDay].map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: "#F7F7F5", borderRadius: 8, border: "1px solid #E3E3E0" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 2 }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{ev.type}</div>
                </div>
                <div>
                  <Badge variant={ev.status === "published" ? "success" : ev.status === "draft" ? "default" : "warning"}>
                    {ev.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
