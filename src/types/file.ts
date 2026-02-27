import type { Tag } from './task'

export interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  storageUrl: string
  downloadUrl: string
  thumbnailUrl: string | null
  folderId: string | null
  tags: Tag[]
  notes: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  color: string | null
  createdAt: string
  userId: string
}
