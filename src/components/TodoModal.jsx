import { useState, useEffect, useRef } from 'react'
import useTodoStore from '../store'
import MarkdownEditor from './MarkdownEditor'
import TagChip from './TagChip'
import ProjectSelector from './ProjectSelector'
import {
  parseNaturalDate, formatDate, TAG_COLOR_OPTIONS, getTagColor,
  scheduleReminder, clearReminder, requestNotificationPermission
} from '../utils'

export default function TodoModal({ todo, onClose, defaultProjectId }) {
  const { addTodo, updateTodo, deleteTodo, tags, addTag, updateTag, deleteTag } = useTodoStore()
  const isNew = !todo

  const [form, setForm] = useState({
    title: todo?.title || '',
    description: todo?.description || '',
    dueDate: todo?.dueDate || '',
    dueDateInput: todo?.dueDate || '',
    tags: todo?.tags || [],
    reminder: todo?.reminder || '',
    projectId: todo?.projectId ?? defaultProjectId ?? null,
  })

  const [parsedDate, setParsedDate] = useState(null)
  const [showNewTag, setShowNewTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('blue')
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Parse natural language date
  useEffect(() => {
    const input = form.dueDateInput?.trim()
    if (!input) { setParsedDate(null); return }
    // Check if it's already a yyyy-MM-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      setForm((f) => ({ ...f, dueDate: input }))
      setParsedDate(formatDate(input))
      return
    }
    const parsed = parseNaturalDate(input)
    if (parsed) {
      setForm((f) => ({ ...f, dueDate: parsed }))
      setParsedDate(formatDate(parsed))
    } else {
      setForm((f) => ({ ...f, dueDate: '' }))
      setParsedDate(null)
    }
  }, [form.dueDateInput])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSave = () => {
    if (!form.title.trim()) return
    const data = {
      title: form.title.trim(),
      description: form.description,
      dueDate: form.dueDate || null,
      tags: form.tags,
      reminder: form.reminder || null,
      projectId: form.projectId,
    }
    if (isNew) {
      const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)
      addTodo(data)
      // Schedule reminder for new todo (we'll get the ID from store next tick)
      // The store generates the ID, so we schedule from store's latest
    } else {
      updateTodo(todo.id, data)
      clearReminder(todo.id)
      if (data.reminder && data.dueDate) {
        scheduleReminder({ ...todo, ...data })
      }
    }
    onClose()
  }

  const handleDelete = () => {
    if (todo && window.confirm('Delete this task?')) {
      clearReminder(todo.id)
      deleteTodo(todo.id)
      onClose()
    }
  }

  const toggleTag = (tagId) => {
    set('tags', form.tags.includes(tagId)
      ? form.tags.filter((id) => id !== tagId)
      : [...form.tags, tagId])
  }

  const handleCreateTag = () => {
    if (!newTagName.trim()) return
    addTag({ name: newTagName.trim(), color: newTagColor })
    setShowNewTag(false)
    setNewTagName('')
    setNewTagColor('blue')
  }

  const handleReminderRequest = async () => {
    await requestNotificationPermission()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && e.metaKey) handleSave()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onKeyDown={handleKeyDown}>
        <div className="modal-body">
          {/* Title */}
          <div className="form-field">
            <input
              ref={titleRef}
              className="form-input title-input"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-label">Notes</label>
            <MarkdownEditor
              value={form.description}
              onChange={(v) => set('description', v)}
            />
          </div>

          {/* Due Date */}
          <div className="form-field">
            <label className="form-label">Due Date</label>
            <div className="date-field-wrap">
              <span className="date-field-icon">📅</span>
              <input
                className="form-input"
                placeholder='Today, Tomorrow, "next Monday", or date...'
                value={form.dueDateInput}
                onChange={(e) => set('dueDateInput', e.target.value)}
              />
            </div>
            {parsedDate && <div className="date-parsed-hint">→ {parsedDate}</div>}
          </div>

          {/* Reminder */}
          <div className="form-field">
            <label className="form-label">Reminder</label>
            <div className="reminder-row">
              <input
                className="form-input"
                type="time"
                value={form.reminder}
                onChange={(e) => set('reminder', e.target.value)}
                onClick={handleReminderRequest}
                style={{ maxWidth: 140 }}
              />
              {form.reminder && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => set('reminder', '')}
                >Clear</button>
              )}
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>Requires Due Date</span>
            </div>
          </div>

          {/* Project */}
          <div className="form-field">
            <label className="form-label">Project</label>
            <ProjectSelector value={form.projectId} onChange={(id) => set('projectId', id)} />
          </div>

          {/* Tags */}
          <div className="form-field">
            <label className="form-label">Tags</label>
            <div className="tag-selector">
              {tags.map((tag) => {
                const color = getTagColor(tag.color)
                const selected = form.tags.includes(tag.id)
                return (
                  <span
                    key={tag.id}
                    className={`tag-option ${selected ? 'selected' : ''}`}
                    style={{ background: color.bg, color: color.text }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <span className="tag-dot" style={{ background: color.dot }} />
                    {tag.name}
                  </span>
                )
              })}
              {!showNewTag ? (
                <button className="tag-create-btn" onClick={() => setShowNewTag(true)}>
                  + New tag
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', width: '100%' }}>
                  <input
                    autoFocus
                    className="form-input"
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag(); if (e.key === 'Escape') setShowNewTag(false) }}
                    style={{ maxWidth: 140 }}
                  />
                  <div className="tag-color-options">
                    {TAG_COLOR_OPTIONS.map((c) => (
                      <div
                        key={c.id}
                        className={`tag-color-swatch ${newTagColor === c.id ? 'selected' : ''}`}
                        style={{ background: c.dot }}
                        onClick={() => setNewTagColor(c.id)}
                      />
                    ))}
                  </div>
                  <button className="btn btn-accent btn-sm" onClick={handleCreateTag}>Add</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowNewTag(false)}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div>
            {!isNew && (
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            )}
          </div>
          <div className="modal-footer-right">
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}><kbd className="kbd">⌘↵</kbd> to save</span>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-accent"
              onClick={handleSave}
              disabled={!form.title.trim()}
              style={{ opacity: form.title.trim() ? 1 : 0.5 }}
            >
              {isNew ? 'Add Task' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
