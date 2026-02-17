import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchCalendarEvents, type CalendarEvent } from '../api/calendar'
import './CalendarPage.css'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

/** Max event chips shown inline before showing "+N more" */
const MAX_INLINE = 2

function parseDate(iso: string | null): Date | null {
    if (!iso) return null
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d
}

function sameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

function formatTime(d: Date): string {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatShortDate(d: Date): string {
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${formatTime(d)}`
}


function formatFullDate(d: Date): string {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]
    return `${dayName}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/** Monday-start day-of-week index (0=Mon … 6=Sun) */
function mondayIndex(date: Date): number {
    return (date.getDay() + 6) % 7
}

interface DayCell {
    date: Date | null
    day: number
    isToday: boolean
    events: CalendarEvent[]
}

function buildMonth(year: number, month: number, events: CalendarEvent[]): DayCell[] {
    const today = new Date()
    const firstOfMonth = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startPad = mondayIndex(firstOfMonth)

    const buckets = new Map<number, CalendarEvent[]>()
    for (const ev of events) {
        const d = parseDate(ev.startDate)
        if (!d) continue
        if (d.getFullYear() !== year || d.getMonth() !== month) continue
        const day = d.getDate()
        if (!buckets.has(day)) buckets.set(day, [])
        buckets.get(day)!.push(ev)
    }

    const cells: DayCell[] = []
    for (let i = 0; i < startPad; i++) {
        cells.push({ date: null, day: 0, isToday: false, events: [] })
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
        cells.push({
            date,
            day: d,
            isToday: sameDay(date, today),
            events: buckets.get(d) ?? [],
        })
    }
    const remainder = cells.length % 7
    if (remainder !== 0) {
        for (let i = 0; i < 7 - remainder; i++) {
            cells.push({ date: null, day: 0, isToday: false, events: [] })
        }
    }
    return cells
}

/* ────────────────────────────────────────── */

export const CalendarPage: React.FC = () => {
    const { user } = useAuth()
    const role = user?.role ?? 'student'

    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCell, setSelectedCell] = useState<DayCell | null>(null)

    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth())

    useEffect(() => {
        if (role === 'student' || role === 'teacher') {
            setLoading(true)
            fetchCalendarEvents(role)
                .then(setEvents)
                .catch(() => setEvents([]))
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [role])

    const cells = useMemo(() => buildMonth(year, month, events), [year, month, events])

    // Close panel when month changes
    useEffect(() => { setSelectedCell(null) }, [year, month])

    const goPrev = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    const goNext = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }
    const goToday = () => {
        const t = new Date()
        setYear(t.getFullYear())
        setMonth(t.getMonth())
    }


    const handleDayClick = useCallback((cell: DayCell) => {
        if (cell.day === 0) return
        // Toggle: click same day again closes the panel
        setSelectedCell(prev =>
            prev && prev.day === cell.day ? null : cell
        )
    }, [])

    return (
        <div className="calendar-page">
            {/* ── Header ── */}
            <div className="calendar-header">
                <div className="calendar-header-left">
                    <h1 className="page-title">Calendar</h1>
                    <p className="page-description">
                        {role === 'teacher'
                            ? 'Lessons & quizzes from your courses'
                            : 'Lessons & quizzes from your enrolled courses'}
                    </p>
                </div>

                <div className="calendar-nav">
                    <button className="calendar-today-btn" onClick={goToday}>Today</button>
                    <button className="calendar-nav-btn" onClick={goPrev} aria-label="Previous month">‹</button>
                    <span className="calendar-month-label">{MONTH_NAMES[month]} {year}</span>
                    <button className="calendar-nav-btn" onClick={goNext} aria-label="Next month">›</button>
                </div>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div className="calendar-loading">
                    <div className="calendar-loading-spinner" />
                    <div>Loading calendar…</div>
                </div>
            )}

            {/* ── Main area: grid + optional detail panel ── */}
            {!loading && (
                <>
                    <div className={`calendar-body ${selectedCell ? 'calendar-body-with-panel' : ''}`}>
                        {/* ── Grid ── */}
                        <div className="calendar-grid">
                            {DAY_NAMES.map((d) => (
                                <div key={d} className="calendar-dow">{d}</div>
                            ))}

                            {cells.map((cell, idx) => {
                                const isSelected = selectedCell !== null && selectedCell.day === cell.day && cell.day > 0
                                const cls = [
                                    'calendar-day',
                                    cell.day === 0 ? 'calendar-day-empty' : 'calendar-day-clickable',
                                    cell.isToday ? 'calendar-day-today' : '',
                                    isSelected ? 'calendar-day-selected' : '',
                                    cell.events.length > 0 ? 'calendar-day-has-events' : '',
                                ].filter(Boolean).join(' ')

                                const visible = cell.events.slice(0, MAX_INLINE)
                                const overflow = cell.events.length - MAX_INLINE

                                return (
                                    <div
                                        key={idx}
                                        className={cls}
                                        onClick={() => handleDayClick(cell)}
                                    >
                                        {cell.day > 0 && (
                                            <span className="calendar-day-number">{cell.day}</span>
                                        )}

                                        {visible.map((ev) => {
                                            const start = parseDate(ev.startDate)
                                            const end = parseDate(ev.endDate)
                                            return (
                                                <div key={`${ev.type}-${ev.id}`} className="calendar-event-wrapper">
                                                    <div
                                                        className={`calendar-event calendar-event-${ev.type}`}
                                                    >
                                                        {ev.title}
                                                    </div>
                                                    <div className="calendar-event-tooltip">
                                                        <div className="calendar-tooltip-title">{ev.title}</div>
                                                        <div className="calendar-tooltip-course">{ev.courseTitle}</div>
                                                        {(start || end) && (
                                                            <div className="calendar-tooltip-dates">
                                                                {start && <>Start: {formatShortDate(start)}</>}
                                                                {start && end && <> — </>}
                                                                {end && <>End: {formatShortDate(end)}</>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {overflow > 0 && (
                                            <span className="calendar-event-more">+{overflow} more</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* ── Day detail panel ── */}
                        {selectedCell && selectedCell.date && (
                            <div className="calendar-detail-panel">
                                <div className="calendar-detail-header">
                                    <div>
                                        <div className="calendar-detail-date">
                                            {formatFullDate(selectedCell.date)}
                                        </div>
                                        <div className="calendar-detail-count">
                                            {selectedCell.events.length} event{selectedCell.events.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    <button
                                        className="calendar-detail-close"
                                        onClick={() => setSelectedCell(null)}
                                        aria-label="Close panel"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="calendar-detail-events">
                                    {selectedCell.events.length === 0 && (
                                        <div className="calendar-detail-empty">No events on this day</div>
                                    )}

                                    {selectedCell.events.map((ev) => {
                                        const start = parseDate(ev.startDate)
                                        const end = parseDate(ev.endDate)
                                        return (
                                            <div
                                                key={`${ev.type}-${ev.id}`}
                                                className={`calendar-detail-card calendar-detail-card-${ev.type}`}
                                            >
                                                <div className="calendar-detail-card-top">
                                                    <span className={`calendar-detail-badge calendar-detail-badge-${ev.type}`}>
                                                        {ev.type === 'lesson' ? '📘 Lesson' : '📝 Quiz'}
                                                    </span>
                                                </div>
                                                <div className="calendar-detail-card-title">{ev.title}</div>
                                                <div className="calendar-detail-card-course">{ev.courseTitle}</div>
                                                {(start || end) && (
                                                    <div className="calendar-detail-card-time">
                                                        {start && <span>🕐 {formatTime(start)}</span>}
                                                        {start && end && <span> — </span>}
                                                        {end && <span>{formatTime(end)}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Legend ── */}
                    <div className="calendar-legend">
                        <div className="calendar-legend-item">
                            <span className="calendar-legend-dot calendar-legend-dot-lesson" />
                            Lesson
                        </div>
                        <div className="calendar-legend-item">
                            <span className="calendar-legend-dot calendar-legend-dot-quiz" />
                            Quiz
                        </div>
                        <div className="calendar-legend-hint">
                            Click any day to see all events
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
