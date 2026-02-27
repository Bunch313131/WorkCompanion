import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Upload,
  Camera,
  Download,
  Laptop,
  Smartphone,
  Monitor,
  Clock,
  X,
  File,
  Inbox,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatFileSize, getRelativeTime } from '@/lib/utils'
import { useQuickShare } from '@/hooks/useQuickShare'
import type { QuickShareFile } from '@/hooks/useQuickShare'
import { useIsMobile } from '@/hooks/useMediaQuery'

const DEVICE_ICONS = {
  laptop: Laptop,
  desktop: Monitor,
  phone: Smartphone,
  tablet: Smartphone,
  unknown: Monitor,
} as const

export default function QuickShare() {
  const { files, loading, uploads, uploadFiles, removeFile, deviceName, deviceType } = useQuickShare()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

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
      uploadFiles(e.dataTransfer.files)
    },
    [uploadFiles]
  )

  const DeviceIcon = DEVICE_ICONS[deviceType]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quick Share</h1>
        <p className="text-sm text-muted-foreground">
          Share files instantly between your devices. No more emailing yourself.
        </p>
      </div>

      {/* Upload Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? 'var(--color-primary)' : 'var(--color-border)',
          backgroundColor: isDragging ? 'rgba(232, 122, 30, 0.05)' : 'transparent',
        }}
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-8 md:p-12',
          'transition-colors duration-200 text-center'
        )}
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/5 rounded-2xl flex items-center justify-center z-10"
            >
              <div className="text-center">
                <Upload className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-lg font-semibold text-primary">Drop files here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-4">
            <Share2 className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Send files to your other devices</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Drag and drop files here, or use the buttons below.
            Files will be available on all your devices instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium',
                'bg-primary text-primary-foreground',
                'shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity'
              )}
            >
              <Upload className="w-4 h-4" />
              Choose Files
            </motion.button>

            {isMobile && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => cameraInputRef.current?.click()}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium',
                  'bg-gradient-to-r from-slate-600 to-slate-700 text-white',
                  'shadow-lg shadow-slate-600/25 hover:opacity-90 transition-opacity'
                )}
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </motion.button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </motion.div>

      {/* Device info */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DeviceIcon className="w-4 h-4" />
          <span>Sending from: <strong className="text-foreground">{deviceName}</strong></span>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div key={upload.fileId} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.fileName}</p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {Math.round(upload.progress)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Shared Files */}
      {!loading && files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Shared Files ({files.length})
            </h2>
          </div>

          <div className="grid gap-3">
            <AnimatePresence>
              {files.map((file) => (
                <SharedFileCard key={file.id} file={file} onRemove={removeFile} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && files.length === 0 && uploads.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border bg-card p-8 text-center"
        >
          <Inbox className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Your shared files will appear here</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Upload files from any device and they'll be available for download on all your other devices.
          </p>
        </motion.div>
      )}
    </div>
  )
}

function SharedFileCard({ file, onRemove }: { file: QuickShareFile; onRemove: (file: QuickShareFile) => void }) {
  const DeviceIcon = DEVICE_ICONS[file.senderDeviceType]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border border-border bg-card',
        'hover:shadow-md hover:shadow-black/5 transition-all group'
      )}
    >
      {/* Thumbnail or icon */}
      {file.thumbnailUrl ? (
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <File className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <DeviceIcon className="w-3 h-3" />
            {file.senderDeviceName}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {getRelativeTime(file.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <a
          href={file.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={file.name}
          className={cn(
            'p-2 rounded-lg transition-colors',
            'hover:bg-primary/10 text-primary'
          )}
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={() => onRemove(file)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            'hover:bg-destructive/10 text-muted-foreground hover:text-destructive',
            'md:opacity-0 md:group-hover:opacity-100'
          )}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}
