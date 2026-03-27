import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { format, addDays } from 'date-fns'

const today = () => format(new Date(), 'yyyy-MM-dd')
const inDays = (n) => format(addDays(new Date(), n), 'yyyy-MM-dd')

// Seed data shown on first load
const SEED_AREA_ID = 'seed-area-work'
const SEED_PROJ_DESIGN = 'seed-proj-design'
const SEED_PROJ_DEV = 'seed-proj-dev'
const SEED_TAG_URGENT = 'seed-tag-urgent'
const SEED_TAG_REVIEW = 'seed-tag-review'

const SEED_DATA = {
  areas: [
    { id: SEED_AREA_ID, name: 'Work', collapsed: false, order: 0 },
  ],
  projects: [
    { id: SEED_PROJ_DESIGN, name: 'Design System', icon: '🎨', color: '#AF52DE', areaId: SEED_AREA_ID, order: 0 },
    { id: SEED_PROJ_DEV, name: 'Web App', icon: '🚀', color: '#007AFF', areaId: SEED_AREA_ID, order: 1 },
    { id: 'seed-proj-personal', name: 'Personal', icon: '🏠', color: '#34C759', areaId: null, order: 2 },
  ],
  tags: [
    { id: SEED_TAG_URGENT, name: 'Urgent', color: 'red' },
    { id: SEED_TAG_REVIEW, name: 'Review', color: 'blue' },
    { id: 'seed-tag-design', name: 'Design', color: 'purple' },
  ],
  todos: [
    { id: uuidv4(), title: 'Review design mockups with the team', description: '## Agenda\n- Component library updates\n- Color system review\n- Typography scale', dueDate: today(), tags: [SEED_TAG_REVIEW, 'seed-tag-design'], reminder: null, projectId: SEED_PROJ_DESIGN, completed: false, completedAt: null, order: 0, createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Fix responsive layout on mobile', description: '', dueDate: today(), tags: [SEED_TAG_URGENT], reminder: null, projectId: SEED_PROJ_DEV, completed: false, completedAt: null, order: 1, createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Write API documentation', description: 'Document all endpoints with examples and error codes.', dueDate: inDays(2), tags: [], reminder: null, projectId: SEED_PROJ_DEV, completed: false, completedAt: null, order: 2, createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Update component tokens', description: '', dueDate: inDays(3), tags: ['seed-tag-design'], reminder: null, projectId: SEED_PROJ_DESIGN, completed: false, completedAt: null, order: 3, createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Buy groceries', description: '- Milk\n- Eggs\n- Coffee', dueDate: null, tags: [], reminder: null, projectId: 'seed-proj-personal', completed: false, completedAt: null, order: 4, createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Schedule dentist appointment', description: '', dueDate: inDays(7), tags: [], reminder: null, projectId: null, completed: false, completedAt: null, order: 5, createdAt: new Date().toISOString() },
    { id: uuidv4(), title: 'Set up project repository', description: '', dueDate: null, tags: [], reminder: null, projectId: SEED_PROJ_DEV, completed: true, completedAt: new Date(Date.now() - 86400000).toISOString(), order: 6, createdAt: new Date().toISOString() },
  ],
}

const useTodoStore = create(
  persist(
    (set, get) => ({
      todos: SEED_DATA.todos,
      projects: SEED_DATA.projects,
      areas: SEED_DATA.areas,
      tags: SEED_DATA.tags,
      activeView: 'today',
      sidebarCollapsed: false,

      // ─── Todo Actions ────────────────────────────────────────────────
      addTodo: (todo) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              id: uuidv4(),
              title: '',
              description: '',
              dueDate: null,
              tags: [],
              reminder: null,
              completed: false,
              completedAt: null,
              projectId: null,
              order: state.todos.length,
              ...todo,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateTodo: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        })),

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : null,
                }
              : t
          ),
        })),

      reorderTodos: (reorderedTodos) =>
        set((state) => {
          const reorderedIds = new Set(reorderedTodos.map((t) => t.id))
          const rest = state.todos.filter((t) => !reorderedIds.has(t.id))
          return { todos: [...reorderedTodos, ...rest] }
        }),

      // ─── Project Actions ─────────────────────────────────────────────
      addProject: (project) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: uuidv4(),
              name: 'New Project',
              icon: '📋',
              color: '#007AFF',
              areaId: null,
              order: state.projects.length,
              ...project,
            },
          ],
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          todos: state.todos.map((t) =>
            t.projectId === id ? { ...t, projectId: null } : t
          ),
        })),

      reorderProjects: (newProjects) => set({ projects: newProjects }),

      // ─── Area Actions ─────────────────────────────────────────────────
      addArea: (area) =>
        set((state) => ({
          areas: [
            ...state.areas,
            {
              id: uuidv4(),
              name: 'New Area',
              collapsed: false,
              order: state.areas.length,
              ...area,
            },
          ],
        })),

      updateArea: (id, updates) =>
        set((state) => ({
          areas: state.areas.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),

      deleteArea: (id) =>
        set((state) => ({
          areas: state.areas.filter((a) => a.id !== id),
          projects: state.projects.map((p) =>
            p.areaId === id ? { ...p, areaId: null } : p
          ),
        })),

      toggleAreaCollapse: (id) =>
        set((state) => ({
          areas: state.areas.map((a) =>
            a.id === id ? { ...a, collapsed: !a.collapsed } : a
          ),
        })),

      // ─── Tag Actions ──────────────────────────────────────────────────
      addTag: (tag) =>
        set((state) => ({
          tags: [
            ...state.tags,
            {
              id: uuidv4(),
              name: '',
              color: 'blue',
              ...tag,
            },
          ],
        })),

      updateTag: (id, updates) =>
        set((state) => ({
          tags: state.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTag: (id) =>
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
          todos: state.todos.map((todo) => ({
            ...todo,
            tags: todo.tags.filter((tagId) => tagId !== id),
          })),
        })),

      // ─── UI Actions ───────────────────────────────────────────────────
      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'todoapp-v1',
    }
  )
)

export default useTodoStore
