import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

type Tone = 'blue' | 'purple' | 'amber' | 'green' | 'slate'

interface TagProps {
  tone?: Tone
  dot?: boolean
  children: ReactNode
}

export function Tag({ tone = 'blue', dot = false, children }: TagProps) {
  return (
    <span className={cx('tag', `tag--${tone}`)}>
      {dot ? <span className="tag__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
