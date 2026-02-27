import type { Tag } from './task'

export interface Note {
  id: string
  title: string
  content: string
  tags: Tag[]
  pinned: boolean
  templateName: string | null
  createdAt: string
  updatedAt: string
  userId: string
}
