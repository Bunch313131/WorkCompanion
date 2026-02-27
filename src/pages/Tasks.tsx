import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  List,
  Columns3,
  Calendar,
  Filter,
  CheckSquare,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from '@/lib/constants'
import type { Task, Priority, TaskStatus } from '@/types/task'
import { generateId } from '@/lib/utils'

type ViewMode = 'list' | 'kanban' | 'calendar'

export default function Tasks() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [tasks, setTasks] = useState<Task[]>([])
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium')
  const [filterOpen, setFilterOpen] = useState(false)

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    const task: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      description: '',
      status: 'todo',
      priority: newTaskPriority,
      tags: [],
      subtasks: [],
      dueDate: null,
      projectId: null,
      attachmentIds: [],
      recurring: false,
      recurrencePattern: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      userId: '',
    }
    setTasks((prev) => [task, ...prev])
    setNewTaskTitle('')
    setShowNewTask(false)
  }

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status, updatedAt: new Date().toISOString(), completedAt: status === 'done' ? new Date().toISOString() : null }
          : t
      )
    )
  }

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  const viewButtons = [
    { mode: 'list' as const, icon: List, label: 'List' },
    { mode: 'kanban' as const, icon: Columns3, label: 'Board' },
    { mode: 'calendar' as const, icon: Calendar, label: 'Calendar' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {viewButtons.map((btn) => (
              <button
                key={btn.mode}
                onClick={() => setViewMode(btn.mode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
                  viewMode === btn.mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <btn.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Filter */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              'p-2 rounded-lg hover:bg-accent transition-colors',
              'text-muted-foreground hover:text-foreground',
              filterOpen && 'bg-accent text-foreground'
            )}
          >
            <Filter className="w-5 h-5" />
          </button>

          {/* Add Task */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewTask(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-primary text-primary-foreground',
              'shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity'
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </motion.button>
        </div>
      </div>

      {/* New Task Input */}
      <AnimatePresence>
        {showNewTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                  className={cn(
                    'flex-1 h-10 px-4 rounded-lg text-sm',
                    'bg-muted border border-border',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    'placeholder:text-muted-foreground'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask()
                    if (e.key === 'Escape') setShowNewTask(false)
                  }}
                />
                {/* Priority selector */}
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                  className={cn(
                    'h-10 px-3 rounded-lg text-sm',
                    'bg-muted border border-border',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                <button
                  onClick={addTask}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowNewTask(false)}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content based on view mode */}
      {tasks.length === 0 && !showNewTask ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to get organized. Use tasks to track your to-dos, deadlines, and work items."
          action={{
            label: 'Create First Task',
            onClick: () => setShowNewTask(true),
          }}
        />
      ) : viewMode === 'kanban' ? (
        <KanbanView tasks={tasks} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
      ) : viewMode === 'list' ? (
        <ListView tasks={tasks} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Calendar view coming soon
        </div>
      )}
    </div>
  )
}

function ListView({
  tasks,
  onStatusChange,
  onDelete,
}: {
  tasks: Task[]
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {tasks.map((task, i) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl border border-border bg-card',
            'hover:shadow-md hover:shadow-black/5 transition-all group',
            task.status === 'done' && 'opacity-60'
          )}
        >
          {/* Checkbox */}
          <button
            onClick={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0',
              task.status === 'done'
                ? 'bg-success border-success text-white'
                : 'border-border hover:border-primary'
            )}
          >
            {task.status === 'done' && <CheckSquare className="w-3 h-3" />}
          </button>

          {/* Title */}
          <span className={cn('flex-1 text-sm', task.status === 'done' && 'line-through text-muted-foreground')}>
            {task.title}
          </span>

          {/* Priority badge */}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: PRIORITY_CONFIG[task.priority].bg,
              color: PRIORITY_CONFIG[task.priority].color,
            }}
          >
            {PRIORITY_CONFIG[task.priority].label}
          </span>

          {/* Status */}
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {TASK_STATUS_CONFIG[task.status].label}
          </span>

          {/* Delete */}
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </div>
  )
}

function KanbanView({
  tasks,
  onStatusChange,
}: {
  tasks: Task[]
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
}) {
  const columns: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status)
        const config = TASK_STATUS_CONFIG[status]
        return (
          <div
            key={status}
            className="rounded-xl bg-muted/50 p-3 min-h-[200px]"
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <h3 className="text-sm font-semibold">{config.label}</h3>
              <span className="text-xs text-muted-foreground ml-auto">{columnTasks.length}</span>
            </div>

            <div className="space-y-2">
              {columnTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <p className="text-sm font-medium mb-2">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        backgroundColor: PRIORITY_CONFIG[task.priority].bg,
                        color: PRIORITY_CONFIG[task.priority].color,
                      }}
                    >
                      {PRIORITY_CONFIG[task.priority].label}
                    </span>

                    {/* Quick status change dropdown */}
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="text-[10px] bg-transparent border-none text-muted-foreground focus:outline-none cursor-pointer"
                    >
                      {columns.map((s) => (
                        <option key={s} value={s}>{TASK_STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
