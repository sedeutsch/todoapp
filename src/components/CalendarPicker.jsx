import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isBefore, startOfDay, parseISO } from 'date-fns'

export default function CalendarPicker({ value, onChange, onClose }) {
  const todayDate = startOfDay(new Date())
  const selected = value ? parseISO(value) : null
  const [viewMonth, setViewMonth] = useState(selected || todayDate)

  const isCurrentMonth = isSameMonth(viewMonth, todayDate)

  const selectDate = (date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    onClose()
  }

  const buildGrid = () => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 })
    const days = []
    let cur = start
    while (cur <= end) {
      days.push(cur)
      cur = addDays(cur, 1)
    }
    return days
  }

  const days = buildGrid()
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="cal-popover" onMouseDown={(e) => e.stopPropagation()}>
      <div className="cal-header">
        <button
          className="cal-nav"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          disabled={isCurrentMonth}
          style={{ opacity: isCurrentMonth ? 0.2 : 1, cursor: isCurrentMonth ? 'default' : 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="cal-month-label">{format(viewMonth, 'MMMM yyyy')}</span>
        <button className="cal-nav" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <div className="cal-grid">
        {dayLabels.map((d) => (
          <div key={d} className="cal-day-label">{d}</div>
        ))}
        {days.map((day, i) => {
          const isPast = isBefore(startOfDay(day), todayDate)
          const isToday = isSameDay(day, todayDate)
          const isSelected = selected && isSameDay(day, selected)
          const isOtherMonth = !isSameMonth(day, viewMonth)
          return (
            <button
              key={i}
              className={`cal-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${isOtherMonth || isPast ? 'is-disabled' : ''}`}
              onClick={() => !isPast && !isOtherMonth && selectDate(day)}
              disabled={isPast || isOtherMonth}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      <div className="cal-footer">
        <button className="cal-today-btn" onClick={() => selectDate(todayDate)}>Today</button>
        {value && (
          <button className="cal-clear-btn" onClick={() => { onChange(''); onClose() }}>Clear</button>
        )}
      </div>
    </div>
  )
}
