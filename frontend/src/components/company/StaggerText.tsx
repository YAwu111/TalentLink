import { motion, useReducedMotion, type Variants } from 'motion/react'

import { cn } from '@/lib/utils'

interface StaggerTextProps {
  text: string
  className?: string
}

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.028, delayChildren: 0.06 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 140, damping: 20 },
  },
}

/** 中文字符级错峰入场；屏幕阅读器只读完整 aria-label。 */
export function StaggerText({ text, className }: StaggerTextProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    <motion.span
      className={cn('inline-block', className)}
      aria-label={text}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {Array.from(text).map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          aria-hidden="true"
          variants={itemVariants}
          className="inline-block whitespace-pre"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  )
}
