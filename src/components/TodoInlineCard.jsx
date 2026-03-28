import { useState, useEffect, useRef } from 'react'
import useTodoStore from '../store'
import MarkdownEditor from './MarkdownEditor'
import TagChip from './TagChip'
import CalendarPicker from './CalendarPicker'
import { formatDate, getTagColor, todayStr } from '../utils'

export default function TodoInlineCard({ todo, onClose }) {
  const { updateTodo, deleteTodo, toggleTodo, tags } = useTodoStore()

  const [title, setTitle] = useState(todo.title || '')
  const [description, setDescription] = useState(todo.description || '')
  const [dueDate, setDueDate] = useState(todo.dueDate || '')
  const [selectedTags, setSelectedTags] = useState(todo.tags || [])
  const [showCalendar, setShowCalendar] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)

  const cardRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  // Click outside → save and close
  useEffect(() => {
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) save()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  const save = () => {
    if (!title.trim()) return
    updateTodo(todo.id, { title: title.trim(), description, dueDate: dueDate || null, tags: selectedTags })
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'Enter' && e.target === titleRef.current) {
      e.preventDefault()
      cardRef.current?.querySelector('.tiptap-editor')?.focus()
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const today = todayStr()
  const dateLabel = dueDate === today ? 'Today' : dueDate ? formatDate(dueDate) : null
  const activeTags = selectedTags.map((id) => tags.find((t) => t.id === id)).filter(Boolean)

  return (
    <div className="todo-inline-card" ref={cardRef} onKeyDown={handleKeyDown}>
      <div className="todo-inline-top">
        <div
          className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id) }}
          title={todo.completed ? 'Mark incomplete' : 'Complete'}
        >
          {todo.completed && '✓'}
        </div>
        <input
          ref={titleRef}
          className="todo-inline-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
      </div>

      <div className="todo-inline-notes">
        <MarkdownEditor value={description} onChange={setDescription} placeholder="Notes" />
      </div>

      {activeTags.length > 0 && (
        <div className="todo-inline-tags">
          {activeTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} onRemove={() => toggleTag(tag.id)} />
          ))}
        </div>
      )}

      <div className="todo-inline-footer">
        {/* Date label (left) */}
        <div className="todo-inline-date-area">
          {dateLabel && (
            <button
              className="todo-inline-date-chip has-date"
              onClick={(e) => { e.stopPropagation(); setShowCalendar((v) => !v) }}
            >
              <span className="todo-inline-star">★</span>
              <span>{dateLabel}</span>
            </button>
          )}
        </div>

        {/* Action icons (right) */}
        <div className="todo-inline-actions">
          {/* Calendar */}
          <div style={{ position: 'relative' }}>
            <button
              className={`todo-inline-action-btn ${showCalendar ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowCalendar((v) => !v); setShowTagPicker(false) }}
              title="Set due date"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            {showCalendar && (
              <CalendarPicker
                value={dueDate}
                onChange={setDueDate}
                onClose={() => setShowCalendar(false)}
              />
            )}
          </div>

          {/* Tags */}
          <div style={{ position: 'relative' }}>
            <button
              className={`todo-inline-action-btn ${showTagPicker ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setShowTagPicker((v) => !v); setShowCalendar(false) }}
              title="Tags"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </button>
            {showTagPicker && tags.length > 0 && (
              <div className="todo-inline-tag-popover" onMouseDown={(e) => e.stopPropagation()}>
                {tags.map((tag) => {
                  const color = getTagColor(tag.color)
                  const selected = selectedTags.includes(tag.id)
                  return (
                    <div
                      key={tag.id}
                      className={`todo-inline-tag-option ${selected ? 'selected' : ''}`}
                      style={selected ? { background: color.bg, color: color.text } : {}}
                      onClick={() => toggleTag(tag.id)}
                    >
                      <span className="tag-dot" style={{ background: color.dot }} />
                      {tag.name}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            className="todo-inline-action-btn"
            title="Delete"
            onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); onClose() }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
