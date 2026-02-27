import { motion } from 'framer-motion'
import {
  CheckSquare,
  Share2,
  FolderOpen,
  StickyNote,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const quickActions = [
  { icon: Plus, label: 'New Task', color: 'from-orange-500 to-amber-500', path: '/tasks' },
  { icon: Share2, label: 'Quick Share', color: 'from-slate-600 to-slate-700', path: '/share' },
  { icon: FolderOpen, label: 'Upload File', color: 'from-sky-600 to-sky-700', path: '/files' },
  { icon: StickyNote, label: 'New Note', color: 'from-amber-500 to-yellow-500', path: '/notes' },
]

const statsCards = [
  { icon: CheckSquare, label: 'Active Tasks', value: '0', subtext: 'No tasks yet', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { icon: AlertCircle, label: 'Overdue', value: '0', subtext: 'All clear', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Share2, label: 'Quick Share', value: '0', subtext: 'No pending files', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  { icon: TrendingUp, label: 'This Week', value: '0', subtext: 'Tasks completed', color: 'text-amber-500', bg: 'bg-amber-500/10' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Greeting Banner — steel/gunmetal with orange accent */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e2430] to-[#2a3344] p-6 md:p-8 text-white"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium opacity-90">{APP_NAME}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{greeting}</h1>
          <p className="text-white/70">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {/* Decorative elements — orange glow */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-orange-500/15" />
        <div className="absolute -right-4 -bottom-12 w-32 h-32 rounded-full bg-amber-500/10" />
        {/* Circuit line accent */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-px bg-gradient-to-r from-transparent to-orange-500/30" />
        <div className="absolute right-8 top-[calc(50%+8px)] -translate-y-1/2 w-16 h-px bg-gradient-to-r from-transparent to-orange-500/20" />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl',
                'bg-card border border-border',
                'hover:shadow-lg hover:shadow-black/5 transition-shadow',
                'dark:hover:shadow-black/20'
              )}
            >
              <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center', action.color)}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-sm">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statsCards.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              className={cn(
                'p-4 rounded-xl glass',
                'border border-border'
              )}
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', stat.bg)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              <div className="text-xs text-muted-foreground/70 mt-1">{stat.subtext}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity & Quick Share Inbox */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Your activity will show up here</p>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Quick Share Inbox</h3>
            <button
              onClick={() => navigate('/share')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Share2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No shared files</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Files shared between your devices appear here</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
