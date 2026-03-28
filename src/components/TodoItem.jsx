import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import useTodoStore from '../store'
import TagChip from './TagChip'
import TodoInlineCard from './TodoInlineCard'


export default function TodoItem({ todo, index, showProject = false }) {
  const { toggleTodo, tags } = useTodoStore()
  const [justCompleted, setJustCompleted] = useState(false)
  const [editing, setEditing] = useState(false)

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

  if (editing) {
    return (
      <Draggable draggableId={todo.id} index={index}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
            <TodoInlineCard todo={todo} onClose={() => setEditing(false)} />
          </div>
        )}
      </Draggable>
    )
  }

  return (
    <Draggable draggableId={todo.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`todo-item ${todo.completed ? 'completed' : ''} ${snapshot.isDragging ? 'is-dragging' : ''} ${justCompleted ? 'check-pop' : ''}`}
          onDoubleClick={(e) => { e.preventDefault(); setEditing(true) }}
        >
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
