import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ModeSwitchProps {
  value: 'manual' | 'upload'
}

export function ModeSwitch({ value }: ModeSwitchProps) {
  const navigate = useNavigate()

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1"
      role="group"
      aria-label="资料完善方式"
    >
      <Button
        size="sm"
        variant={value === 'manual' ? 'default' : 'ghost'}
        className={cn('h-8', value === 'manual' && 'shadow-sm')}
        onClick={() => navigate('/employer/profile')}
      >
        手动填写
      </Button>
      <Button
        size="sm"
        variant={value === 'upload' ? 'default' : 'ghost'}
        className={cn('h-8', value === 'upload' && 'shadow-sm')}
        onClick={() => navigate('/employer/profile/upload')}
      >
        文档识别
      </Button>
    </div>
  )
}
