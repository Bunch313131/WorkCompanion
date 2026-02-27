import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomTabs } from './BottomTabs'
import { Header } from './Header'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useIsMobile } from '@/hooks/useMediaQuery'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function AppShell() {
  const { collapsed } = useSidebarStore()
  const isMobile = useIsMobile()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className="transition-all duration-200"
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 72 : 256,
        }}
      >
        <Header />

        <main className="pb-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-4 md:p-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Tabs */}
      <BottomTabs />
    </div>
  )
}
