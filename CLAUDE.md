# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR (Vite)
npm run build     # Production build → dist/
npm run lint      # ESLint on all files
npm run preview   # Preview production build locally
```

No test framework is configured.

## Architecture

Single-page React app (no TypeScript, no backend) with Zustand for state and localStorage persistence.

**State layer:** `src/store.js` — single Zustand store persisted to `localStorage` under key `"todoapp-v1"`. All mutations happen here. Components read and write through this store.

**Data model:**
- `todos` — tasks; optional `projectId`, `tags[]` (ids), `dueDate`, `reminder` (time string "HH:MM"), `completedAt`
- `projects` — optional `areaId`, icon, color
- `areas` — grouping for projects
- `tags` — color-coded labels

**Views** are smart filters over the todos array: `today`, `upcoming`, `anytime`, `completed`, `inbox`, `project:<id>`. The active view is stored in `activeView` in the store.

**Component structure:**
- `App.jsx` — root; initializes reminder scheduling on mount
- `Sidebar.jsx` — navigation, project/area list, drag-and-drop reorder
- `MainContent.jsx` — renders the correct view based on `activeView`
- `TodoItem.jsx` — single draggable todo row (double-click opens inline edit)
- `TodoModal.jsx` — full-featured editor modal (open with `N` key or clicking a todo)
- `TodoInlineCard.jsx` — quick-edit form that replaces a `TodoItem` in-place
- `MarkdownEditor.jsx` — TipTap-based rich text editor used inside `TodoModal`
- `CalendarPicker.jsx` — date popover; uses chrono-node for natural language parsing

**Styling:** CSS variables defined in `src/index.css` (design tokens, layout, shared component styles). App-level overrides in `src/App.css`. No CSS modules or Tailwind — plain CSS with BEM-like class names.

**Drag-and-drop:** `@hello-pangea/dnd` (fork of react-beautiful-dnd). Used for todo reordering and project reordering in the sidebar.

**Keyboard shortcuts:** `N` → new todo modal, `Escape` → close modal, `Cmd+Enter` → save, `Cmd+/` → toggle sidebar.

**Reminders:** Scheduled via `setTimeout` in `App.jsx` using the browser Notification API. Re-scheduled on app load from todos that have a `reminder` field and a future `dueDate`.
