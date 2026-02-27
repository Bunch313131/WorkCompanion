import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME, APP_TAGLINE, APP_LOGO } from '@/lib/constants'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Firebase auth will be connected here
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
      {/* Background decoration — subtle orange/steel glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-slate-500/8 blur-3xl" />
        {/* Circuit line decorations */}
        <div className="absolute top-20 left-10 w-32 h-px bg-gradient-to-r from-orange-500/20 to-transparent" />
        <div className="absolute top-24 left-10 w-20 h-px bg-gradient-to-r from-orange-500/10 to-transparent" />
        <div className="absolute bottom-32 right-10 w-40 h-px bg-gradient-to-l from-orange-500/15 to-transparent" />
        <div className="absolute bottom-36 right-10 w-24 h-px bg-gradient-to-l from-orange-500/10 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Logo + Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="inline-flex"
          >
            {APP_LOGO ? (
              <img src={APP_LOGO} alt={APP_NAME} className="w-80 h-auto mx-auto" />
            ) : (
              <h1 className="text-4xl font-bold gradient-text">{APP_NAME}</h1>
            )}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-slate-400 mt-3"
          >
            {APP_TAGLINE}
          </motion.p>
        </div>

        {/* Form Card — dark steel glass */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-8 shadow-2xl bg-[#161b22]/90 backdrop-blur-xl border border-[#2a3040]"
        >
          <h2 className="text-xl font-semibold mb-6 text-slate-100">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={cn(
                    'w-full h-11 pl-10 pr-4 rounded-lg text-sm text-slate-100',
                    'bg-[#0d1117] border border-[#2a3040]',
                    'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50',
                    'placeholder:text-slate-600'
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className={cn(
                    'w-full h-11 pl-10 pr-11 rounded-lg text-sm text-slate-100',
                    'bg-[#0d1117] border border-[#2a3040]',
                    'focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50',
                    'placeholder:text-slate-600'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className={cn(
                'w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
                'shadow-lg shadow-orange-500/25',
                'hover:from-orange-400 hover:to-amber-400 transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-400 hover:text-orange-400 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </motion.div>

        {/* Skip for now */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-4"
        >
          <p className="text-xs text-slate-500">
            You can use the app without signing in. Sign in to enable cross-device sync.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
