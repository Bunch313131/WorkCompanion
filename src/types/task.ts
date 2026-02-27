export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  tags: Tag[]
  subtasks: Subtask[]
  dueDate: string | null
  projectId: string | null
  attachmentIds: string[]
  recurring: boolean
  recurrencePattern: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  userId: string
}
