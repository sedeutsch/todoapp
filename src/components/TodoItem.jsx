import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import useTodoStore from '../store'
import TagChip from './TagChip'


export default function TodoItem({ todo, index, showProject = false, onEdit }) {
  const { toggleTodo, tags } = useTodoStore()
  const [justCompleted, setJustCompleted] = useState(false)

  const todoTags = (todo.tags || [])
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean)

  const handleCheck = (e) => {
    e.stopPropagation()
    if (!todo.completed) {
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 500)
    }
    toggleTodo(todo.id)
  }

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
            <div className="todo-row">
              <span className="todo-title">{todo.title || 'Untitled'}</span>
              {todoTags.length > 0 && (
                <div className="todo-tags-inline">
                  {todoTags.map((tag) => (
                    <TagChip key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
              {todo.reminder && (
                <span className="todo-reminder-icon" title={`Reminder: ${todo.reminder}`}>🔔</span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
