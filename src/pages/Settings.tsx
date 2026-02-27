import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Monitor,
  Laptop,
  Sun,
  Moon,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/stores/themeStore'
import { APP_NAME, APP_LOGO, QUICK_SHARE_EXPIRY_OPTIONS } from '@/lib/constants'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function Settings() {
  const { isDark, toggleTheme } = useThemeStore()
  const [shareExpiry, setShareExpiry] = useState(24)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your {APP_NAME} preferences</p>
      </div>

      {/* Profile Section */}
      <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-semibold">Not signed in</p>
              <p className="text-sm text-muted-foreground">Sign in to sync across devices</p>
            </div>
          </div>
          <button
            className={cn(
              'w-full py-2.5 rounded-lg text-sm font-medium',
              'bg-primary text-primary-foreground',
              'hover:opacity-90 transition-opacity'
            )}
          >
            Sign In
          </button>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            Appearance
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <button
              onClick={toggleTheme}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-300',
                isDark ? 'bg-orange-500' : 'bg-muted'
              )}
            >
              <motion.div
                animate={{ x: isDark ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
              >
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 text-orange-500" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
              </motion.div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Share */}
      <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Quick Share
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">File Expiration</p>
            <p className="text-xs text-muted-foreground mb-3">
              How long shared files stay available before auto-cleanup
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_SHARE_EXPIRY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setShareExpiry(option.value)}
                  className={cn(
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    shareExpiry === option.value
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Devices */}
      <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Your Devices
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">This Device</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-success" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Sign in to register this device and enable cross-device file sharing.
          </p>
        </div>
      </motion.div>

      {/* About */}
      <motion.div variants={itemVariants} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            {APP_LOGO ? (
              <img src={APP_LOGO} alt={APP_NAME} className="w-48 h-auto" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
            )}
            <div>
              <p className="font-semibold">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
