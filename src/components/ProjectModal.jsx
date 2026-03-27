import { useState } from 'react'
import useTodoStore from '../store'
import { PROJECT_COLOR_OPTIONS } from '../utils'

const COMMON_EMOJIS = ['📋', '🎯', '💼', '🏠', '🎨', '📚', '🚀', '💡', '🌱', '⚡', '🔧', '💰', '🎵', '🏋️', '✈️', '❤️']

export default function ProjectModal({ project, defaultAreaId, onClose }) {
  const { addProject, updateProject, deleteProject, areas } = useTodoStore()
  const isNew = !project

  const [name, setName] = useState(project?.name || '')
  const [icon, setIcon] = useState(project?.icon || '📋')
  const [color, setColor] = useState(project?.color || '#007AFF')
  const [areaId, setAreaId] = useState(project?.areaId || defaultAreaId || '')
  const [customEmoji, setCustomEmoji] = useState('')

  const handleSave = () => {
    if (!name.trim()) return
    const data = { name: name.trim(), icon, color, areaId: areaId || null }
    if (isNew) addProject(data)
    else updateProject(project.id, data)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm(`Delete project "${project.name}"? Tasks will move to Inbox.`)) {
      deleteProject(project.id)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-body">
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            {isNew ? 'New Project' : 'Edit Project'}
          </div>

          {/* Icon + Name */}
          <div className="form-field">
            <label className="form-label">Name</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                width: 38, height: 38, border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, cursor: 'default', flexShrink: 0
              }}>
                {icon}
              </div>
              <input
                autoFocus
                className="form-input"
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
              />
            </div>
          </div>

          {/* Icon picker */}
          <div className="form-field">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  style={{
                    width: 32, height: 32, fontSize: 16,
                    borderRadius: 'var(--radius-sm)',
                    border: icon === e ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                    background: icon === e ? 'var(--accent-subtle)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                className="form-input"
                placeholder="Or paste any emoji..."
                value={customEmoji}
                onChange={(e) => { setCustomEmoji(e.target.value); if (e.target.value) setIcon(e.target.value) }}
                style={{ maxWidth: 160 }}
              />
            </div>
          </div>

          {/* Color */}
          <div className="form-field">
            <label className="form-label">Color</label>
            <div className="color-swatches">
              {PROJECT_COLOR_OPTIONS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Area */}
          {areas.length > 0 && (
            <div className="form-field">
              <label className="form-label">Area</label>
              <select
                className="form-input"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                <option value="">No area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div>
            {!isNew && (
              <button className="btn btn-danger" onClick={handleDelete}>Delete Project</button>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-accent"
              onClick={handleSave}
              disabled={!name.trim()}
              style={{ opacity: name.trim() ? 1 : 0.5 }}
            >
              {isNew ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
