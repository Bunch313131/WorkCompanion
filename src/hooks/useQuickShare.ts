import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage } from '@/firebase'
import { generateId } from '@/lib/utils'

export interface QuickShareFile {
  id: string
  name: string
  mimeType: string
  size: number
  downloadUrl: string
  storagePath: string
  thumbnailUrl: string | null
  senderDeviceName: string
  senderDeviceType: 'laptop' | 'desktop' | 'phone' | 'tablet' | 'unknown'
  createdAt: Date
}

interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
}

function detectDeviceType(): QuickShareFile['senderDeviceType'] {
  const ua = navigator.userAgent
  if (/Mobi|Android/i.test(ua)) return 'phone'
  if (/Tablet|iPad/i.test(ua)) return 'tablet'
  return 'laptop'
}

function detectDeviceName(): string {
  const type = detectDeviceType()
  const platform = navigator.platform || 'Unknown'
  if (platform.includes('Mac')) return 'Mac'
  if (platform.includes('Win')) return 'Windows PC'
  if (type === 'phone') return 'Phone'
  return 'Device'
}

export function useQuickShare() {
  const [files, setFiles] = useState<QuickShareFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  // Real-time listener for shared files
  useEffect(() => {
    const q = query(
      collection(db, 'quickshare'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: QuickShareFile[] = snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          name: data.name,
          mimeType: data.mimeType,
          size: data.size,
          downloadUrl: data.downloadUrl,
          storagePath: data.storagePath,
          thumbnailUrl: data.thumbnailUrl,
          senderDeviceName: data.senderDeviceName,
          senderDeviceType: data.senderDeviceType,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
        }
      })
      setFiles(docs)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Upload files to Firebase Storage + create Firestore doc
  const uploadFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return

    const filesToUpload = Array.from(fileList)

    for (const file of filesToUpload) {
      const fileId = generateId()
      const storagePath = `quickshare/${fileId}_${file.name}`
      const storageRef = ref(storage, storagePath)

      // Track upload progress
      setUploads((prev) => [...prev, { fileId, fileName: file.name, progress: 0 }])

      try {
        const uploadTask = uploadBytesResumable(storageRef, file)

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploads((prev) =>
                prev.map((u) => u.fileId === fileId ? { ...u, progress } : u)
              )
            },
            (error) => reject(error),
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)

              await addDoc(collection(db, 'quickshare'), {
                name: file.name,
                mimeType: file.type,
                size: file.size,
                downloadUrl,
                storagePath,
                thumbnailUrl: file.type.startsWith('image/') ? downloadUrl : null,
                senderDeviceName: detectDeviceName(),
                senderDeviceType: detectDeviceType(),
                createdAt: serverTimestamp(),
              })

              // Remove from upload tracking
              setUploads((prev) => prev.filter((u) => u.fileId !== fileId))
              resolve()
            }
          )
        })
      } catch (error) {
        console.error('Upload failed:', error)
        setUploads((prev) => prev.filter((u) => u.fileId !== fileId))
      }
    }
  }, [])

  // Delete a shared file
  const removeFile = useCallback(async (file: QuickShareFile) => {
    try {
      // Delete from Storage
      if (file.storagePath) {
        const storageRef = ref(storage, file.storagePath)
        await deleteObject(storageRef).catch(() => {
          // File may already be deleted from storage
        })
      }
      // Delete Firestore doc
      await deleteDoc(doc(db, 'quickshare', file.id))
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }, [])

  return {
    files,
    loading,
    uploads,
    uploadFiles,
    removeFile,
    deviceName: detectDeviceName(),
    deviceType: detectDeviceType(),
  }
}
