import { useState, useEffect } from 'react'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import useTodoStore from '../store'
import TodoItem from './TodoItem'
import TodoModal from './TodoModal'
import { todayStr, formatDateHeader, getViewTitle, groupByDate } from '../utils'
import { format, addDays, parseISO, isToday, isBefore, startOfDay } from 'date-fns'

export default function MainContent() {
  const {
    todos, projects, areas, activeView,
    sidebarCollapsed, toggleSidebar,
    reorderTodos,
  } = useTodoStore()

  const [todoModal, setTodoModal] = useState(null) // null | 'new'
  const [showEmptyDates, setShowEmptyDates] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSidebar()
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey &&
          document.activeElement.tagName === 'BODY') {
        setTodoModal('new')
      }
      if (e.key === 'Escape' && !todoModal) {
        // handled inside modal
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar, todoModal])

  // Get current project
  const currentProject = activeView.startsWith('project:')
    ? projects.find((p) => p.id === activeView.replace('project:', ''))
    : null

  // Filter todos for current view
  const today = todayStr()

  const getViewTodos = () => {
    const incomplete = todos.filter((t) => !t.completed)
    switch (activeView) {
      case 'today':
        return incomplete.filter((t) => t.dueDate === today)
      case 'upcoming':
        return incomplete.filter((t) => t.dueDate && t.dueDate > today)
      case 'anytime':
        return incomplete.filter((t) => !t.dueDate)
      case 'completed':
        return todos.filter((t) => t.completed)
      case 'inbox':
        return incomplete.filter((t) => !t.projectId)
      default:
        if (currentProject) {
          return incomplete.filter((t) => t.projectId === currentProject.id)
        }
        return []
    }
  }

  const viewTodos = getViewTodos()

  // Default project for new todos
  const defaultProjectId = currentProject?.id || null

  // Handle drag end (todos only)
  const handleDragEnd = (result) => {
    const { destination, source } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    // Reorder todos
    const currentList = [...viewTodos]
    const [moved] = currentList.splice(source.index, 1)
    currentList.splice(destination.index, 0, moved)

    const allTodos = [...todos]
    const reorderedIds = new Set(currentList.map((t) => t.id))
    const rest = allTodos.filter((t) => !reorderedIds.has(t.id))
    const updatedList = currentList.map((t, i) => ({ ...t, order: i }))
    reorderTodos([...updatedList, ...rest])
  }

  const viewTitle = currentProject
    ? `${currentProject.icon} ${currentProject.name}`
    : getViewTitle(activeView, projects)

  const subtitle = {
    today: format(new Date(), 'EEEE, MMMM d'),
    upcoming: 'Tasks scheduled for upcoming dates',
    anytime: 'Tasks without a due date',
    completed: 'All completed tasks',
    inbox: 'Unassigned tasks',
  }[activeView] || (currentProject ? `${projects.find(p => areas.find(a => a.id === p.areaId)?.name)?.name || ''} project` : '')

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="main-content">
        <div className="main-header">
          <div className="main-header-inner">
          <div className="main-header-top">
            {sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                style={{ marginRight: 4, padding: '4px 6px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 14 }}
                title="Open sidebar"
              >
                ☰
              </button>
            )}
            <h1 className="main-title">{viewTitle}</h1>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                className="header-btn primary"
                onClick={() => setTodoModal('new')}
                title="New task (N)"
              >
                + New Task
              </button>
            </div>
          </div>
          {subtitle && <div className="main-subtitle">{subtitle}</div>}
          </div>
        </div>

        <div className="todo-list-container">
          <div className="todo-list">
            {activeView === 'upcoming' ? (
              <UpcomingView
                todos={viewTodos}
                showEmptyDates={showEmptyDates}
                setShowEmptyDates={setShowEmptyDates}
              />
            ) : activeView === 'completed' ? (
              <CompletedView todos={viewTodos} />
            ) : (
              <StandardView
                todos={viewTodos}
                view={activeView}
                onNew={() => setTodoModal('new')}
              />
            )}
          </div>
        </div>
      </div>

      {todoModal === 'new' && (
        <TodoModal
          todo={null}
          defaultProjectId={defaultProjectId}
          onClose={() => setTodoModal(null)}
        />
      )}
    </DragDropContext>
  )
}

// ─── Standard View (Today / Anytime / Inbox / Project) ────────────────────────
function StandardView({ todos, view, onNew }) {
  const sorted = [...todos].sort((a, b) => {
    // Sort by order, then creation date
    if (a.order !== b.order) return (a.order ?? 0) - (b.order ?? 0)
    return new Date(a.createdAt) - new Date(b.createdAt)
  })

  const EMPTY = {
    today: { icon: '☀️', title: 'Enjoy your day!', sub: "No tasks due today — you're all caught up." },
    anytime: { icon: '🗂', title: 'No tasks', sub: 'Tasks with no due date appear here.' },
    inbox: { icon: '📥', title: 'Inbox is empty', sub: 'Unassigned tasks will appear here.' },
    default: { icon: '✓', title: 'All done!', sub: 'No tasks in this project.' },
  }

  const empty = EMPTY[view] || EMPTY.default

  return (
    <Droppable droppableId="main-list" type="TODO">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {sorted.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={index}
              showProject={view !== 'project'}
            />
          ))}
          {provided.placeholder}

          {/* Empty state */}
          {sorted.length === 0 && (
            <div className="todo-empty">
              <div className="todo-empty-icon">{empty.icon}</div>
              <div className="todo-empty-title">{empty.title}</div>
              <div className="todo-empty-sub">{empty.sub}</div>
            </div>
          )}

          {/* Quick add */}
          <div className="quick-add" onClick={onNew}>
            <span className="quick-add-icon">+</span>
            <span>Add Task</span>
          </div>
        </div>
      )}
    </Droppable>
  )
}

// ─── Upcoming View ─────────────────────────────────────────────────────────────
function UpcomingView({ todos, showEmptyDates, setShowEmptyDates }) {
  // Generate next 14 days
  const today = todayStr()
  const days = Array.from({ length: 14 }, (_, i) =>
    format(addDays(new Date(), i + 1), 'yyyy-MM-dd')
  )

  const groups = groupByDate(todos)

  // Sort todos within each date
  const sortedDays = days.filter((d) => showEmptyDates || (groups[d] && groups[d].length > 0))

  // Todos beyond 14 days
  const farFuture = todos.filter((t) => {
    const d = t.dueDate
    return d && !days.includes(d)
  })
  const farGroups = groupByDate(farFuture)
  const farDays = Object.keys(farGroups).sort()

  if (todos.length === 0 && !showEmptyDates) {
    return (
      <div className="todo-empty">
        <div className="todo-empty-icon">📅</div>
        <div className="todo-empty-title">Nothing upcoming</div>
        <div className="todo-empty-sub">Tasks with future due dates will appear here.</div>
      </div>
    )
  }

  const DaySection = ({ dateStr }) => {
    const dayTodos = (groups[dateStr] || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const dateObj = parseISO(dateStr)
    const label = formatDateHeader(dateStr)
    const isTodayDate = isToday(dateObj)

    return (
      <div className="upcoming-group">
        <div className={`upcoming-date-header ${isTodayDate ? 'is-today' : ''}`}>
          <span>{label}</span>
          {dayTodos.length > 0 && (
            <span className="upcoming-count">{dayTodos.length} {dayTodos.length === 1 ? 'task' : 'tasks'}</span>
          )}
        </div>
        <Droppable droppableId={`upcoming-${dateStr}`} type="TODO">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {dayTodos.map((todo, index) => (
                <TodoItem key={todo.id} todo={todo} index={index} showProject />
              ))}
              {provided.placeholder}
              {dayTodos.length === 0 && (
                <div className="upcoming-empty">No tasks</div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    )
  }

  return (
    <div>
      {sortedDays.map((d) => <DaySection key={d} dateStr={d} />)}
      {farDays.map((d) => <DaySection key={d} dateStr={d} />)}

      <div
        className="hidden-dates-toggle"
        onClick={() => setShowEmptyDates(!showEmptyDates)}
      >
        {showEmptyDates ? '▾ Hide empty days' : '▸ Show empty days'}
      </div>
    </div>
  )
}

// ─── Completed View ────────────────────────────────────────────────────────────
function CompletedView({ todos }) {
  // Group by completion date
  const groups = {}
  todos.forEach((todo) => {
    const date = todo.completedAt
      ? format(new Date(todo.completedAt), 'yyyy-MM-dd')
      : 'unknown'
    if (!groups[date]) groups[date] = []
    groups[date].push(todo)
  })

  const sortedDates = Object.keys(groups).sort().reverse()

  if (todos.length === 0) {
    return (
      <div className="todo-empty">
        <div className="todo-empty-icon">✓</div>
        <div className="todo-empty-title">Nothing completed yet</div>
        <div className="todo-empty-sub">Completed tasks will appear here.</div>
      </div>
    )
  }

  return (
    <div>
      {sortedDates.map((date) => (
        <div key={date} className="upcoming-group">
          <div className="upcoming-date-header">
            <span>{date === 'unknown' ? 'Completed' : formatDateHeader(date)}</span>
            <span className="upcoming-count">{groups[date].length}</span>
          </div>
          <Droppable droppableId={`completed-${date}`} type="TODO">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {groups[date].map((todo, index) => (
                  <TodoItem key={todo.id} todo={todo} index={index} showProject />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </div>
  )
}
