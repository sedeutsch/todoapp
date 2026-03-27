import { useState, useRef, useEffect } from 'react'
import useTodoStore from '../store'

export default function ProjectSelector({ value, onChange }) {
  const { projects, areas } = useTodoStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = value ? projects.find((p) => p.id === value) : null

  // Group projects by area
  const unassigned = projects.filter((p) => !p.areaId)
  const areaGroups = areas.map((a) => ({
    area: a,
    projects: projects.filter((p) => p.areaId === a.id),
  })).filter((g) => g.projects.length > 0)

  return (
    <div className="proj-selector" ref={ref}>
      <button className="proj-selector-btn" onClick={() => setOpen(!open)}>
        {selected ? (
          <>
            <span className="project-dot" style={{ background: selected.color, width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
            <span>{selected.icon} {selected.name}</span>
          </>
        ) : (
          <span>📥 Inbox</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }}>▾</span>
      </button>

      {open && (
        <div className="proj-dropdown">
          <div
            className={`proj-drop-item ${!value ? 'selected' : ''}`}
            onClick={() => { onChange(null); setOpen(false) }}
          >
            <span>📥</span> Inbox
          </div>

          {unassigned.map((p) => (
            <div
              key={p.id}
              className={`proj-drop-item ${value === p.id ? 'selected' : ''}`}
              onClick={() => { onChange(p.id); setOpen(false) }}
            >
              <span className="project-dot" style={{ background: p.color, width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
              <span>{p.icon} {p.name}</span>
            </div>
          ))}

          {areaGroups.map(({ area, projects: aProjects }) => (
            <div key={area.id}>
              <div style={{ padding: '4px 12px 2px', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {area.name}
              </div>
              {aProjects.map((p) => (
                <div
                  key={p.id}
                  className={`proj-drop-item ${value === p.id ? 'selected' : ''}`}
                  style={{ paddingLeft: 20 }}
                  onClick={() => { onChange(p.id); setOpen(false) }}
                >
                  <span className="project-dot" style={{ background: p.color, width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
                  <span>{p.icon} {p.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
