import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  PinOff,
  X,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { NOTE_TEMPLATES } from '@/lib/constants'
import { generateId, getRelativeTime } from '@/lib/utils'
import type { Note } from '@/types/note'

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  const createNote = (templateName?: string, content?: string) => {
    const note: Note = {
      id: generateId(),
      title: templateName || 'Untitled Note',
      content: content || '<p></p>',
      tags: [],
      pinned: false,
      templateName: templateName || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: '',
    }
    setNotes((prev) => [note, ...prev])
    setActiveNote(note)
    setShowTemplates(false)
  }

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    )
    if (activeNote?.id === id) {
      setActiveNote((prev) => prev ? { ...prev, ...updates } : prev)
    }
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (activeNote?.id === id) setActiveNote(null)
  }

  const togglePin = (id: string) => {
    const note = notes.find((n) => n.id === id)
    if (note) updateNote(id, { pinned: !note.pinned })
  }

  const filteredNotes = notes
    .filter((n) => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-sm text-muted-foreground">{notes.length} notes</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className={cn(
                'h-9 pl-10 pr-4 w-48 rounded-lg text-sm',
                'bg-muted border border-border',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
          </div>

          {/* New Note */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTemplates(!showTemplates)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'bg-primary text-primary-foreground',
                'shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity'
              )}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Note</span>
            </motion.button>

            {/* Template dropdown */}
            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2">
                    <button
                      onClick={() => createNote()}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Blank Note
                    </button>
                    <div className="h-px bg-border my-1" />
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase">Templates</p>
                    {NOTE_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        onClick={() => createNote(template.name, template.content)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Create notes to capture meeting minutes, field reports, RFIs, and more. Choose from templates or start blank."
          action={{
            label: 'Create First Note',
            onClick: () => setShowTemplates(true),
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              index={i}
              isActive={activeNote?.id === note.id}
              onClick={() => setActiveNote(note)}
              onPin={() => togglePin(note.id)}
              onDelete={() => deleteNote(note.id)}
            />
          ))}
        </div>
      )}

      {/* Note Editor Modal */}
      <AnimatePresence>
        {activeNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setActiveNote(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                  className="text-lg font-semibold bg-transparent border-none focus:outline-none w-full"
                  placeholder="Note title..."
                />
                <button
                  onClick={() => setActiveNote(null)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground flex-shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Editor Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <textarea
                  value={activeNote.content.replace(/<[^>]*>/g, '')}
                  onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                  placeholder="Start writing..."
                  className={cn(
                    'w-full min-h-[300px] bg-transparent border-none focus:outline-none resize-none',
                    'text-sm leading-relaxed placeholder:text-muted-foreground'
                  )}
                />
              </div>

              {/* Editor Footer */}
              <div className="px-6 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Last edited {getRelativeTime(new Date(activeNote.updatedAt))}
                </span>
                {activeNote.templateName && (
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {activeNote.templateName}
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NoteCard({
  note,
  index,
  isActive,
  onClick,
  onPin,
  onDelete,
}: {
  note: Note
  index: number
  isActive: boolean
  onClick: () => void
  onPin: () => void
  onDelete: () => void
}) {
  const plainContent = note.content.replace(/<[^>]*>/g, '').trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border bg-card cursor-pointer transition-all group',
        isActive ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:shadow-md hover:shadow-black/5'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm line-clamp-1">{note.title}</h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin()
            }}
            className={cn(
              'p-1 rounded transition-colors',
              note.pinned ? 'text-primary' : 'text-muted-foreground opacity-0 group-hover:opacity-100'
            )}
          >
            {note.pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
        {plainContent || 'Empty note'}
      </p>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Clock className="w-3 h-3" />
        {getRelativeTime(new Date(note.updatedAt))}
        {note.templateName && (
          <span className="px-1.5 py-0.5 rounded bg-muted">
            {note.templateName}
          </span>
        )}
      </div>
    </motion.div>
  )
}
