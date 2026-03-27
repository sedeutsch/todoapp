import { useState } from 'react'
import useTodoStore from '../store'

export default function AreaModal({ area, onClose }) {
  const { addArea, updateArea, deleteArea } = useTodoStore()
  const isNew = !area

  const [name, setName] = useState(area?.name || '')

  const handleSave = () => {
    if (!name.trim()) return
    if (isNew) addArea({ name: name.trim() })
    else updateArea(area.id, { name: name.trim() })
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm(`Delete area "${area.name}"? Projects will become unassigned.`)) {
      deleteArea(area.id)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-body">
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            {isNew ? 'New Area' : 'Edit Area'}
          </div>
          <div className="form-field">
            <label className="form-label">Area Name</label>
            <input
              autoFocus
              className="form-input"
              placeholder="e.g. Work, Personal..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
            Areas group multiple projects together in the sidebar.
          </p>
        </div>
        <div className="modal-footer">
          <div>
            {!isNew && (
              <button className="btn btn-danger" onClick={handleDelete}>Delete Area</button>
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
