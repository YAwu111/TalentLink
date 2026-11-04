import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { CompletenessRing } from '@/components/company/CompletenessRing'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  COMPANY_LABELS,
  type CompanyField,
  type CompanyCompleteness,
} from '@/lib/company'

interface CompletenessCardProps {
  completeness: CompanyCompleteness
}

export function CompletenessCard({ completeness }: CompletenessCardProps) {
  return (
    <Card className="gap-0 rounded-2xl border-border/70 py-0 shadow-sm ring-0">
      <CardHeader className="border-b border-border/60 px-5 py-4">
        <CardTitle className="text-[15px] font-semibold">资料完整度</CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-5">
        <div className="flex items-center gap-4">
          <CompletenessRing value={completeness.score} />
          <div className="min-w-0">
            {completeness.isComplete ? (
              <Badge variant="success">
                <CheckCircle2 />
                资料完整
              </Badge>
            ) : (
              <Badge variant="warning">
                <AlertCircle />
                待完善
              </Badge>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              资料完整后，求职者才能投递该企业岗位，岗位也会进入推送范围。
            </p>
          </div>
        </div>

        {completeness.missing.length > 0 ? (
          <div className="mt-4 border-t border-dashed border-border/70 pt-4">
            <p className="text-xs text-muted-foreground">还缺</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {completeness.missing.map((field: CompanyField) => (
                <Badge key={field} variant="neutral">
                  {COMPANY_LABELS[field]}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
