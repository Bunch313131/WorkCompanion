export interface Device {
  id: string
  name: string
  type: 'laptop' | 'desktop' | 'phone' | 'tablet' | 'unknown'
  lastSeen: string
  userId: string
}

export interface SharedFile {
  id: string
  name: string
  mimeType: string
  size: number
  storageUrl: string
  downloadUrl: string
  thumbnailUrl: string | null
  senderDeviceId: string
  senderDeviceName: string
  senderDeviceType: Device['type']
  expiresAt: string | null
  downloaded: boolean
  createdAt: string
  userId: string
}
