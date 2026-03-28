import { useState, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import useTodoStore from '../store'
import { todayStr, TAG_COLOR_OPTIONS, getTagColor } from '../utils'
import ProjectModal from './ProjectModal'
import AreaModal from './AreaModal'

function countTodos(todos, filter) {
  return todos.filter((t) => !t.completed && filter(t)).length
}

export default function Sidebar() {
  const {
    todos, projects, areas, tags,
    activeView, setActiveView,
    sidebarCollapsed, toggleSidebar,
    toggleAreaCollapse, reorderProjects,
    addTag, updateTag, deleteTag,
  } = useTodoStore()

  const [projectModal, setProjectModal] = useState(null)
  const [areaModal, setAreaModal] = useState(null)
  const [editingTagId, setEditingTagId] = useState(null) // tag id being edited, or 'new'
  const [tagForm, setTagForm] = useState({ name: '', color: 'blue' })

  const today = todayStr()

  const smartCounts = {
    today: countTodos(todos, (t) => t.dueDate === today),
    upcoming: countTodos(todos, (t) => t.dueDate && t.dueDate > today),
    anytime: countTodos(todos, (t) => !t.dueDate),
    inbox: countTodos(todos, (t) => !t.projectId),
  }

  const completedCount = todos.filter((t) => t.completed).length

  const projectCount = (projectId) =>
    todos.filter((t) => t.projectId === projectId && !t.completed).length

  // Group projects
  const unassignedProjects = projects
    .filter((p) => !p.areaId)
    .sort((a, b) => a.order - b.order)

  const sortedAreas = [...areas].sort((a, b) => a.order - b.order)

  const SmartView = ({ id, icon, label, count }) => (
    <div
      className={`nav-item ${activeView === id ? 'active' : ''}`}
      onClick={() => setActiveView(id)}
    >
      <span className="nav-item-icon">{icon}</span>
      <span className="nav-item-name">{label}</span>
      {count > 0 && <span className="nav-item-badge">{count}</span>}
    </div>
  )

  const ProjectNavItem = ({ project, index }) => (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`nav-item ${activeView === `project:${project.id}` ? 'active' : ''} ${snapshot.isDragging ? 'is-dragging' : ''}`}
          onClick={() => setActiveView(`project:${project.id}`)}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.85 : 1,
          }}
        >
          <span className="nav-item-icon" style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 7, height: 7, borderRadius: '50%',
              background: project.color, border: '1px solid var(--sidebar-bg)'
            }} />
            {project.icon}
          </span>
          <span className="nav-item-name">{project.name}</span>
          <div className="nav-item-actions">
            <button
              className="nav-action-btn"
              title="Edit project"
              onClick={(e) => { e.stopPropagation(); setProjectModal(project) }}
            >
              ✎
            </button>
          </div>
          <span className="nav-item-badge">{projectCount(project.id) || ''}</span>
        </div>
      )}
    </Draggable>
  )

  const handleProjectDragEnd = (result) => {
    const { destination, source } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const allProjects = [...projects]
    const moved = allProjects.find((_, i) => {
      // find the project being dragged by its position in the source list
      if (source.droppableId === 'unassigned-projects') {
        return unassignedProjects[source.index]?.id === allProjects[allProjects.indexOf(unassignedProjects[source.index])]?.id
      }
      return false
    })

    // Simple approach: rebuild project list
    let projectList = [...allProjects]
    // find moved project
    let movedProject = null
    if (source.droppableId === 'unassigned-projects') {
      movedProject = unassignedProjects[source.index]
    } else if (source.droppableId.startsWith('area-')) {
      const areaId = source.droppableId.replace('area-', '')
      const areaProjects = projectList.filter((p) => p.areaId === areaId).sort((a, b) => a.order - b.order)
      movedProject = areaProjects[source.index]
    }
    if (!movedProject) return

    // Determine new areaId
    let newAreaId = null
    if (destination.droppableId.startsWith('area-')) {
      newAreaId = destination.droppableId.replace('area-', '')
    }

    // Remove from list
    projectList = projectList.filter((p) => p.id !== movedProject.id)

    // Build destination list
    let destList = []
    if (destination.droppableId === 'unassigned-projects') {
      destList = projectList.filter((p) => !p.areaId)
    } else if (destination.droppableId.startsWith('area-')) {
      destList = projectList.filter((p) => p.areaId === newAreaId)
    }

    destList.splice(destination.index, 0, { ...movedProject, areaId: newAreaId })

    // Merge back
    const otherProjects = projectList.filter((p) => {
      if (destination.droppableId === 'unassigned-projects') return p.areaId
      if (destination.droppableId.startsWith('area-')) {
        const aId = destination.droppableId.replace('area-', '')
        return p.areaId !== aId
      }
      return true
    })

    const final = [...destList, ...otherProjects].map((p, i) => ({ ...p, order: i }))
    reorderProjects(final)
  }

  return (
    <DragDropContext onDragEnd={handleProjectDragEnd}>
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={toggleSidebar} title="Collapse sidebar (⌘/)">
            ←
          </button>
        </div>

        <div className="sidebar-content">
          {/* Smart Views */}
          <div className="sidebar-section">
            <SmartView id="today" icon="☀️" label="Today" count={smartCounts.today} />
            <SmartView id="upcoming" icon="📅" label="Upcoming" count={smartCounts.upcoming} />
            <SmartView id="anytime" icon="🗂" label="Anytime" count={smartCounts.anytime} />
            <SmartView
              id="completed"
              icon={<span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>}
              label="Completed"
              count={0}
            />
          </div>

          <div className="sidebar-divider" />

          {/* Inbox */}
          <div className="sidebar-section">
            <div
              className={`nav-item ${activeView === 'inbox' ? 'active' : ''}`}
              onClick={() => setActiveView('inbox')}
            >
              <span className="nav-item-icon">📥</span>
              <span className="nav-item-name">Inbox</span>
              {smartCounts.inbox > 0 && <span className="nav-item-badge">{smartCounts.inbox}</span>}
            </div>
          </div>

          {/* Areas & Projects */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">
              <span>Projects</span>
              <div className="label-actions">
                <button className="label-action-btn" title="New area" onClick={() => setAreaModal('new')}>⊞</button>
                <button className="label-action-btn" title="New project" onClick={() => setProjectModal('new')}>+</button>
              </div>
            </div>

            {/* Unassigned projects (draggable) */}
            <Droppable droppableId="unassigned-projects" type="PROJECT">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {unassignedProjects.map((project, index) => (
                    <ProjectNavItem key={project.id} project={project} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Areas */}
            {sortedAreas.map((area) => {
              const areaProjects = projects
                .filter((p) => p.areaId === area.id)
                .sort((a, b) => a.order - b.order)

              return (
                <div key={area.id} className="area-item">
                  <div className="area-header" onClick={() => toggleAreaCollapse(area.id)}>
                    <span className={`area-chevron ${area.collapsed ? '' : 'open'}`}>▶</span>
                    <span className="area-name">{area.name}</span>
                    <div className="area-header-actions">
                      <button
                        className="nav-action-btn"
                        title="Add project to area"
                        onClick={(e) => { e.stopPropagation(); setProjectModal({ _newInArea: area.id }) }}
                      >
                        +
                      </button>
                      <button
                        className="nav-action-btn"
                        title="Edit area"
                        onClick={(e) => { e.stopPropagation(); setAreaModal(area) }}
                      >
                        ✎
                      </button>
                    </div>
                  </div>

                  {!area.collapsed && (
                    <Droppable droppableId={`area-${area.id}`} type="PROJECT">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {areaProjects.map((project, index) => (
                            <div key={project.id} style={{ paddingLeft: 10 }}>
                              <ProjectNavItem project={project} index={index} />
                            </div>
                          ))}
                          {provided.placeholder}
                          {areaProjects.length === 0 && (
                            <div style={{ padding: '4px 14px', fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                              No projects
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  )}
                </div>
              )
            })}

            {/* Add project CTA if none */}
            {projects.length === 0 && (
              <button
                className="nav-item"
                style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}
                onClick={() => setProjectModal('new')}
              >
                + New Project
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="sidebar-section">
            <div className="sidebar-section-label">
              <span>Tags</span>
              <div className="label-actions">
                <button
                  className="label-action-btn"
                  title="New tag"
                  onClick={() => { setEditingTagId('new'); setTagForm({ name: '', color: 'blue' }) }}
                >+</button>
              </div>
            </div>

            {tags.map((tag) => {
              const color = getTagColor(tag.color)
              if (editingTagId === tag.id) {
                return (
                  <TagForm
                    key={tag.id}
                    form={tagForm}
                    setForm={setTagForm}
                    onSave={() => {
                      if (tagForm.name.trim()) updateTag(tag.id, { name: tagForm.name.trim(), color: tagForm.color })
                      setEditingTagId(null)
                    }}
                    onCancel={() => setEditingTagId(null)}
                  />
                )
              }
              return (
                <div key={tag.id} className="nav-item tag-nav-item">
                  <span className="tag-nav-dot" style={{ background: color.dot }} />
                  <span className="nav-item-name">{tag.name}</span>
                  <div className="nav-item-actions">
                    <button
                      className="nav-action-btn"
                      title="Edit tag"
                      onClick={(e) => { e.stopPropagation(); setEditingTagId(tag.id); setTagForm({ name: tag.name, color: tag.color }) }}
                    >✎</button>
                    <button
                      className="nav-action-btn"
                      title="Delete tag"
                      onClick={(e) => { e.stopPropagation(); deleteTag(tag.id) }}
                    >✕</button>
                  </div>
                </div>
              )
            })}

            {editingTagId === 'new' && (
              <TagForm
                form={tagForm}
                setForm={setTagForm}
                onSave={() => {
                  if (tagForm.name.trim()) addTag({ name: tagForm.name.trim(), color: tagForm.color })
                  setEditingTagId(null)
                }}
                onCancel={() => setEditingTagId(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Collapsed sidebar toggle */}
      {sidebarCollapsed && (
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title="Open sidebar (⌘/)"
          style={{
            position: 'fixed', top: 12, left: 12, zIndex: 100,
            background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
            width: 28, height: 28, borderRadius: 'var(--radius-sm)',
          }}
        >
          →
        </button>
      )}

      {/* Modals */}
      {projectModal && (
        <ProjectModal
          project={projectModal === 'new' ? null : projectModal._newInArea ? null : projectModal}
          defaultAreaId={projectModal?._newInArea || null}
          onClose={() => setProjectModal(null)}
        />
      )}
      {areaModal && (
        <AreaModal
          area={areaModal === 'new' ? null : areaModal}
          onClose={() => setAreaModal(null)}
        />
      )}
    </DragDropContext>
  )
}

function TagForm({ form, setForm, onSave, onCancel }) {
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div className="tag-form">
      <input
        ref={inputRef}
        className="tag-form-input"
        placeholder="Tag name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
      />
      <div className="tag-form-colors">
        {TAG_COLOR_OPTIONS.map((c) => (
          <button
            key={c.id}
            className={`tag-color-swatch ${form.color === c.id ? 'selected' : ''}`}
            style={{ background: c.dot }}
            onClick={() => setForm((f) => ({ ...f, color: c.id }))}
            title={c.id}
          />
        ))}
      </div>
      <div className="tag-form-actions">
        <button className="btn btn-accent btn-sm" onClick={onSave}>Save</button>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
