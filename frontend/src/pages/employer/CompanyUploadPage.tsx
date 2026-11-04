import { useSearchParams } from 'react-router-dom'
import { FileText, ShieldCheck, Sparkles } from 'lucide-react'

import { ModeSwitch } from '@/components/company/ModeSwitch'
import { StaggerText } from '@/components/company/StaggerText'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  {
    id: 'intro',
    title: '企业介绍文档',
    description: '上传企业介绍、营业执照等材料，识别后自动填充企业资料。',
    icon: FileText,
    badge: '优先支持',
  },
  {
    id: 'identity',
    title: '企业身份验证',
    description: '上传营业执照或认证材料，提交管理员审核，不参与字段识别。',
    icon: ShieldCheck,
    badge: '审核材料',
  },
] as const

export function CompanyUploadPage() {
  usePageTitle('资料上传')
  const [params] = useSearchParams()
  const selected = params.get('type') === 'identity' ? 'identity' : 'intro'

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
            企业中心
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[30px]">
            <StaggerText text="资料上传" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            用文档快速完善资料，或提交身份验证材料。上传与识别将在下一阶段接入。
          </p>
        </div>
        <ModeSwitch value="upload" />
      </header>

      <Card className="mt-6 gap-0 overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm ring-0">
        <CardHeader className="border-b border-border/60 px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
            <Sparkles className="size-4 text-primary" />
            选择上传类型
            <Badge variant="neutral" className="ml-auto">
              下一阶段接入
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            const active = category.id === selected
            return (
              <div
                key={category.id}
                className={cn(
                  'rounded-2xl border p-5 transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/70 bg-card',
                )}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="mt-4 flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{category.title}</h2>
                  <Badge variant={active ? 'info' : 'neutral'}>
                    {category.badge}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="mt-5 gap-0 rounded-2xl border-dashed border-border/80 bg-card/60 py-0 shadow-none ring-0">
        <CardContent className="grid min-h-[220px] place-items-center px-5 py-10 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="size-5" />
            </span>
            <h2 className="mt-4 text-sm font-semibold">上传与识别即将接入</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
              当前仅完成信息架构与入口。下一阶段会支持单个文件上传、识别结果预览、
              字段级确认，以及身份材料的模拟提交审核。
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
