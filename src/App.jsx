import { useEffect } from 'react'
import useTodoStore from './store'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import { rescheduleAllReminders } from './utils'

export default function App() {
  const { todos } = useTodoStore()

  // Reschedule any pending reminders on mount
  useEffect(() => {
    rescheduleAllReminders(todos)
  }, [])

  return (
    <div className="app-layout">
      <Sidebar />
      <MainContent />
    </div>
  )
}
