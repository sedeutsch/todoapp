import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import useTodoStore from '../store'
import TagChip from './TagChip'
import { formatDate, isOverdue, todayStr, getTagColor } from '../utils'

export default function TodoItem({ todo, index, showProject = false, onEdit }) {
  const { toggleTodo, tags, projects } = useTodoStore()
  const [justCompleted, setJustCompleted] = useState(false)

  const todoTags = (todo.tags || [])
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean)

  const project = todo.projectId ? projects.find((p) => p.id === todo.projectId) : null

  const handleCheck = (e) => {
    e.stopPropagation()
    if (!todo.completed) {
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 500)
    }
    toggleTodo(todo.id)
  }

  const dateLabel = formatDate(todo.dueDate)
  const dueDateClass = !todo.dueDate
    ? ''
    : isOverdue(todo.dueDate) && !todo.completed
    ? 'overdue'
    : todo.dueDate === todayStr()
    ? 'today-date'
    : 'future-date'

  return (
    <Draggable draggableId={todo.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`todo-item ${todo.completed ? 'completed' : ''} ${snapshot.isDragging ? 'is-dragging' : ''} ${justCompleted ? 'check-pop' : ''}`}
          onClick={() => onEdit(todo)}
        >
          {/* Drag handle */}
          <span
            {...provided.dragHandleProps}
            className="todo-drag-handle"
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            ⠿
          </span>

          {/* Checkbox */}
          <div
            className={`todo-checkbox ${justCompleted ? 'check-pop' : ''}`}
            onClick={handleCheck}
            title={todo.completed ? 'Mark incomplete' : 'Complete'}
          >
            {todo.completed && '✓'}
          </div>

          {/* Content */}
          <div className="todo-content">
            <div className="todo-title">{todo.title || 'Untitled'}</div>
            <div className="todo-meta">
              {dateLabel && (
                <span className={`todo-date ${dueDateClass}`}>
                  {dueDateClass === 'overdue' ? '⚠ ' : ''}
                  {dateLabel}
                </span>
              )}
              {showProject && project && (
                <span className="todo-project-badge">
                  <span className="project-dot" style={{ background: project.color }} />
                  {project.icon} {project.name}
                </span>
              )}
              {todoTags.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="todo-right">
            {todo.reminder && (
              <span title={`Reminder: ${todo.reminder}`} style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>🔔</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
