import type { ReactNode } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'motion/react'

import { cn } from '@/lib/utils'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
}

/** 鼠标跟随的 spotlight 边缘光；不改变布局，也不触发 React 重渲染。 */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const reducedMotion = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const background = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, rgba(29, 78, 216, 0.12), transparent 72%)`

  return (
    <div
      className={cn('group relative overflow-hidden', className)}
      onPointerMove={(event) => {
        if (reducedMotion) return
        const rect = event.currentTarget.getBoundingClientRect()
        mouseX.set(event.clientX - rect.left)
        mouseY.set(event.clientY - rect.top)
      }}
    >
      {reducedMotion ? null : (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}
