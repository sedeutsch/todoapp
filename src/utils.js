import { format, isToday, isTomorrow, isPast, addDays, startOfDay, parseISO } from 'date-fns'
import * as chrono from 'chrono-node'

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function parseNaturalDate(input) {
  if (!input || !input.trim()) return null
  const parsed = chrono.parseDate(input, new Date(), { forwardDate: true })
  return parsed ? format(parsed, 'yyyy-MM-dd') : null
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMM d, yyyy')
}

export function formatDateLong(dateStr) {
  if (!dateStr) return ''
  const date = parseISO(dateStr)
  return format(date, 'EEEE, MMMM d')
}

export function formatDateHeader(dateStr) {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today · ' + format(date, 'MMMM d')
  return format(date, 'EEEE, MMMM d')
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  return isPast(startOfDay(addDays(parseISO(dateStr), 1)))
}

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function groupByDate(todos) {
  const groups = {}
  todos.forEach((todo) => {
    const key = todo.dueDate || 'no-date'
    if (!groups[key]) groups[key] = []
    groups[key].push(todo)
  })
  return groups
}

// ─── Color Utilities ──────────────────────────────────────────────────────────

export const TAG_COLOR_OPTIONS = [
  { id: 'red',    bg: '#FFEBE9', text: '#C01438', dot: '#E5534B' },
  { id: 'orange', bg: '#FFF3E0', text: '#B35900', dot: '#E06B17' },
  { id: 'yellow', bg: '#FFFBDD', text: '#7A5B00', dot: '#D4A700' },
  { id: 'green',  bg: '#E6F4EA', text: '#1A7F37', dot: '#2DA44E' },
  { id: 'blue',   bg: '#DDF4FF', text: '#0969DA', dot: '#1F8EFF' },
  { id: 'purple', bg: '#F3E8FF', text: '#7C3AED', dot: '#8B5CF6' },
  { id: 'pink',   bg: '#FFE4F0', text: '#AD1A72', dot: '#E879A5' },
  { id: 'teal',   bg: '#E0F5F1', text: '#0D7377', dot: '#14A097' },
  { id: 'gray',   bg: '#F1F1F1', text: '#57606A', dot: '#8B949E' },
]

export const PROJECT_COLOR_OPTIONS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#AF52DE', '#5AC8FA', '#FF6B35', '#636366',
  '#00C7BE', '#30B0C7', '#32ADE6', '#BF5AF2',
]

export function getTagColor(colorId) {
  return TAG_COLOR_OPTIONS.find((c) => c.id === colorId) || TAG_COLOR_OPTIONS[4]
}

// ─── Notification Utilities ───────────────────────────────────────────────────

const scheduledTimers = {}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function scheduleReminder(todo) {
  if (!todo.reminder || !todo.dueDate) return
  clearReminder(todo.id)

  const dateTime = new Date(`${todo.dueDate}T${todo.reminder}:00`)
  const now = new Date()
  const delay = dateTime.getTime() - now.getTime()

  if (delay <= 0) return

  scheduledTimers[todo.id] = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(`Reminder: ${todo.title}`, {
        body: 'You have a task reminder',
        icon: '/favicon.ico',
        tag: todo.id,
      })
    }
    delete scheduledTimers[todo.id]
  }, delay)
}

export function clearReminder(todoId) {
  if (scheduledTimers[todoId]) {
    clearTimeout(scheduledTimers[todoId])
    delete scheduledTimers[todoId]
  }
}

export function rescheduleAllReminders(todos) {
  todos.forEach((todo) => {
    if (!todo.completed && todo.reminder && todo.dueDate) {
      scheduleReminder(todo)
    }
  })
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function getViewTitle(view, projects) {
  const smartViews = { today: 'Today', upcoming: 'Upcoming', anytime: 'Anytime', completed: 'Completed', inbox: 'Inbox' }
  if (smartViews[view]) return smartViews[view]
  if (view.startsWith('project:')) {
    const id = view.replace('project:', '')
    const proj = projects.find((p) => p.id === id)
    return proj ? proj.name : 'Project'
  }
  return ''
}

export function getViewIcon(view) {
  const icons = {
    today: '☀️',
    upcoming: '📅',
    anytime: '🗂',
    completed: '✓',
    inbox: '📥',
  }
  return icons[view] || ''
}
