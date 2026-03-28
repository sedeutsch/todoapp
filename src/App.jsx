import { useEffect } from 'react'
import useTodoStore from './store'
import { rescheduleAllReminders } from './utils'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'

export default function App() {
  const { todos } = useTodoStore()

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
