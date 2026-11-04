import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

export function FadeIn({ children, className, delay = 0, y = 12 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20, delay }}
    >
      {children}
    </motion.div>
  )
}
