import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen,
  Upload,
  Grid3X3,
  List,
  Search,
  File,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Presentation,
  Video,
  X,
  Download,
  FolderPlus,
  ChevronRight,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatFileSize, generateId, getRelativeTime } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import type { FileItem, Folder } from '@/types/file'

type ViewMode = 'grid' | 'list'

const FILE_TYPE_ICONS: Record<string, typeof File> = {
  image: ImageIcon,
  pdf: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  video: Video,
  file: File,
}

function getFileTypeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FILE_TYPE_ICONS.image
  if (mimeType === 'application/pdf') return FILE_TYPE_ICONS.pdf
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FILE_TYPE_ICONS.spreadsheet
  if (mimeType.includes('document') || mimeType.includes('word')) return FILE_TYPE_ICONS.document
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return FILE_TYPE_ICONS.presentation
  if (mimeType.startsWith('video/')) return FILE_TYPE_ICONS.video
  return FILE_TYPE_ICONS.file
}

export default function Files() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      const newFiles: FileItem[] = Array.from(fileList).map((file) => ({
        id: generateId(),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        storageUrl: '',
        downloadUrl: URL.createObjectURL(file),
        thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        folderId: currentFolderId,
        tags: [],
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: '',
      }))
      setFiles((prev) => [...newFiles, ...prev])
    },
    [currentFolderId]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const createFolder = () => {
    if (!newFolderName.trim()) return
    const folder: Folder = {
      id: generateId(),
      name: newFolderName.trim(),
      parentId: currentFolderId,
      color: null,
      createdAt: new Date().toISOString(),
      userId: '',
    }
    setFolders((prev) => [folder, ...prev])
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const currentFolders = folders.filter((f) => f.parentId === currentFolderId)
  const currentFiles = files
    .filter((f) => f.folderId === currentFolderId)
    .filter((f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Build breadcrumb path
  const buildBreadcrumb = (): Folder[] => {
    const path: Folder[] = []
    let folderId = currentFolderId
    while (folderId) {
      const folder = folders.find((f) => f.id === folderId)
      if (folder) {
        path.unshift(folder)
        folderId = folder.parentId
      } else {
        break
      }
    }
    return path
  }

  const breadcrumb = buildBreadcrumb()

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-sm text-muted-foreground">
            {files.length} files{folders.length > 0 && `, ${folders.length} folders`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className={cn(
                'h-9 pl-10 pr-4 w-48 rounded-lg text-sm',
                'bg-muted border border-border',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'placeholder:text-muted-foreground'
              )}
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* New Folder */}
          <button
            onClick={() => setShowNewFolder(true)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <FolderPlus className="w-5 h-5" />
          </button>

          {/* Upload */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-primary text-primary-foreground',
              'shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity'
            )}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </motion.button>
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>
          {breadcrumb.map((folder) => (
            <div key={folder.id} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <button
                onClick={() => setCurrentFolderId(folder.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Folder Input */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <FolderOpen className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className={cn(
                  'flex-1 h-9 px-3 rounded-lg text-sm',
                  'bg-muted border border-border',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createFolder()
                  if (e.key === 'Escape') setShowNewFolder(false)
                }}
              />
              <button onClick={createFolder} className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground">
                Create
              </button>
              <button onClick={() => setShowNewFolder(false)} className="p-1.5 rounded hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop zone overlay */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative"
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-primary/5 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center"
            >
              <div className="text-center">
                <Upload className="w-10 h-10 text-primary mx-auto mb-2" />
                <p className="text-primary font-semibold">Drop files to upload</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Folders */}
        {currentFolders.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Folders</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {currentFolders.map((folder) => (
                <motion.button
                  key={folder.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-all text-left"
                >
                  <FolderOpen className="w-8 h-8 text-amber-500 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{folder.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {currentFiles.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {currentFiles.map((file, i) => (
                <FileGridCard key={file.id} file={file} index={i} onDelete={deleteFile} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {currentFiles.map((file, i) => (
                <FileListRow key={file.id} file={file} index={i} onDelete={deleteFile} />
              ))}
            </div>
          )
        ) : currentFolders.length === 0 && !showNewFolder ? (
          <EmptyState
            icon={FolderOpen}
            title="No files yet"
            description="Upload files or create folders to organize your documents, photos, and more."
            action={{
              label: 'Upload Files',
              onClick: () => fileInputRef.current?.click(),
            }}
          />
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

function FileGridCard({ file, index, onDelete }: { file: FileItem; index: number; onDelete: (id: string) => void }) {
  const Icon = getFileTypeIcon(file.mimeType)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all"
    >
      {/* Preview area */}
      <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        {file.thumbnailUrl ? (
          <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <Icon className="w-12 h-12 text-muted-foreground/50" />
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <a
            href={file.downloadUrl}
            download={file.name}
            className="p-2 rounded-full bg-white/90 text-black hover:bg-white transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={() => onDelete(file.id)}
            className="p-2 rounded-full bg-white/90 text-destructive hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
        {/* Tags */}
        {file.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {file.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function FileListRow({ file, index, onDelete }: { file: FileItem; index: number; onDelete: (id: string) => void }) {
  const Icon = getFileTypeIcon(file.mimeType)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-all group"
    >
      {file.thumbnailUrl ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
          <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} &middot; {getRelativeTime(new Date(file.createdAt))}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={file.downloadUrl} download={file.name} className="p-1.5 rounded hover:bg-accent">
          <Download className="w-4 h-4 text-muted-foreground" />
        </a>
        <button onClick={() => onDelete(file.id)} className="p-1.5 rounded hover:bg-destructive/10">
          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </motion.div>
  )
}
