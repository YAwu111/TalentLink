import { motion, useReducedMotion } from 'motion/react'

interface CompletenessRingProps {
  value: number
  size?: number
  strokeWidth?: number
}

export function CompletenessRing({
  value,
  size = 112,
  strokeWidth = 9,
}: CompletenessRingProps) {
  const reducedMotion = useReducedMotion()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100)

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`资料完整度 ${value}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 90, damping: 18 }
          }
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
          <span className="ml-0.5 text-xs font-medium text-muted-foreground">%</span>
        </span>
      </div>
    </div>
  )
}
