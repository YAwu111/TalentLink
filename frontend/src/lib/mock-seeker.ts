export type MockApplicationStatus =
  | 'submitted'
  | 'viewed'
  | 'interview'
  | 'offered'
  | 'rejected'

export interface MockJob {
  id: number
  title: string
  companyName: string
  industry: string
  city: string
  salaryMin: number
  salaryMax: number
  headcount: number
  requirement: string
  otherRequirement: string
  publishedAt: string
  tags: string[]
}

export interface MockApplication {
  id: number
  jobId: number
  jobTitle: string
  companyName: string
  city: string
  salaryMin: number
  salaryMax: number
  appliedAt: string
  status: MockApplicationStatus
  note: string
  offerSalary?: number
}

export const MOCK_JOBS: MockJob[] = [
  {
    id: 1,
    title: '后端开发工程师',
    companyName: '星河科技有限公司',
    industry: '互联网 / 软件',
    city: '上海',
    salaryMin: 18000,
    salaryMax: 30000,
    headcount: 3,
    requirement:
      '负责企业级 SaaS 后端服务设计与开发；熟悉 Python/FastAPI、SQLAlchemy，具备 MySQL、Redis 使用经验；能够独立完成接口设计与性能优化。',
    otherRequirement: '本科及以上学历，3 年以上后端开发经验；有大型分布式系统经验优先。',
    publishedAt: '2026-11-05T09:30:00',
    tags: ['Python', 'FastAPI', 'MySQL'],
  },
  {
    id: 2,
    title: '前端开发工程师',
    companyName: '星河科技有限公司',
    industry: '互联网 / 软件',
    city: '上海',
    salaryMin: 15000,
    salaryMax: 25000,
    headcount: 2,
    requirement:
      '负责企业级 Web 应用前端开发；熟悉 React、TypeScript、Tailwind CSS，关注可访问性与交互细节；有组件库建设经验优先。',
    otherRequirement: '本科及以上学历，2 年以上前端开发经验。',
    publishedAt: '2026-11-04T14:10:00',
    tags: ['React', 'TypeScript', 'Tailwind'],
  },
  {
    id: 3,
    title: '数据分析师',
    companyName: '蓝湾数据服务有限公司',
    industry: '大数据',
    city: '深圳',
    salaryMin: 14000,
    salaryMax: 24000,
    headcount: 2,
    requirement:
      '面向零售客户完成数据清洗、指标体系建设与经营分析；熟练使用 SQL、Python、Tableau，能够独立输出分析报告。',
    otherRequirement: '统计学、数学或计算机相关专业；有零售行业经验优先。',
    publishedAt: '2026-11-03T10:00:00',
    tags: ['SQL', 'Python', 'Tableau'],
  },
  {
    id: 4,
    title: '产品经理',
    companyName: '云帆网络科技有限公司',
    industry: '互联网 / 软件',
    city: '杭州',
    salaryMin: 15000,
    salaryMax: 28000,
    headcount: 1,
    requirement:
      '负责 B 端产品需求调研、方案设计与版本推进；能够与设计、研发、销售协同，具备完整产品生命周期经验。',
    otherRequirement: '3 年以上 B 端产品经验；有 HR SaaS 经验优先。',
    publishedAt: '2026-11-02T16:20:00',
    tags: ['B 端产品', '需求分析', 'SaaS'],
  },
  {
    id: 5,
    title: 'Java 开发工程师',
    companyName: '恒信金融服务有限公司',
    industry: '金融',
    city: '北京',
    salaryMin: 16000,
    salaryMax: 30000,
    headcount: 4,
    requirement:
      '负责核心交易系统开发与维护；熟悉 Java、Spring Boot、MySQL，了解消息队列与分布式事务。',
    otherRequirement: '本科及以上学历；有金融行业系统经验优先。',
    publishedAt: '2026-11-01T11:00:00',
    tags: ['Java', 'Spring Boot', 'MySQL'],
  },
  {
    id: 6,
    title: '运营专员',
    companyName: '青禾教育科技有限公司',
    industry: '教育',
    city: '南京',
    salaryMin: 8000,
    salaryMax: 12000,
    headcount: 2,
    requirement:
      '负责用户增长活动策划、社群运营与数据复盘；具备内容策划能力和数据分析意识。',
    otherRequirement: '本科及以上学历，1 年以上运营经验。',
    publishedAt: '2026-10-30T09:00:00',
    tags: ['用户运营', '活动策划', '数据分析'],
  },
]

export const MOCK_APPLICATIONS: MockApplication[] = [
  {
    id: 1,
    jobId: 1,
    jobTitle: '后端开发工程师',
    companyName: '星河科技有限公司',
    city: '上海',
    salaryMin: 18000,
    salaryMax: 30000,
    appliedAt: '2026-11-05T10:20:00',
    status: 'submitted',
    note: '已投递，等待企业查看',
  },
  {
    id: 2,
    jobId: 2,
    jobTitle: '前端开发工程师',
    companyName: '星河科技有限公司',
    city: '上海',
    salaryMin: 15000,
    salaryMax: 25000,
    appliedAt: '2026-11-03T15:40:00',
    status: 'viewed',
    note: '企业已查看简历',
  },
  {
    id: 3,
    jobId: 3,
    jobTitle: '数据分析师',
    companyName: '蓝湾数据服务有限公司',
    city: '深圳',
    salaryMin: 14000,
    salaryMax: 24000,
    appliedAt: '2026-10-29T09:15:00',
    status: 'interview',
    note: '面试安排在 11 月 8 日 14:00',
  },
  {
    id: 4,
    jobId: 4,
    jobTitle: '产品经理',
    companyName: '云帆网络科技有限公司',
    city: '杭州',
    salaryMin: 15000,
    salaryMax: 28000,
    appliedAt: '2026-10-25T13:30:00',
    status: 'offered',
    note: '已收到录用意向',
    offerSalary: 22000,
  },
  {
    id: 5,
    jobId: 5,
    jobTitle: 'Java 开发工程师',
    companyName: '恒信金融服务有限公司',
    city: '北京',
    salaryMin: 16000,
    salaryMax: 30000,
    appliedAt: '2026-10-20T11:00:00',
    status: 'rejected',
    note: '岗位匹配度不足',
  },
]

export const APPLICATION_STATUS_META: Record<
  MockApplicationStatus,
  { label: string; variant: 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'teal' }
> = {
  submitted: { label: '已投递', variant: 'info' },
  viewed: { label: '已查看', variant: 'warning' },
  interview: { label: '面试中', variant: 'teal' },
  offered: { label: '已录用', variant: 'success' },
  rejected: { label: '未通过', variant: 'destructive' },
}

export function formatSalaryRange(min: number, max: number): string {
  return `${Math.round(min / 1000)}K–${Math.round(max / 1000)}K`
}

export function getMockJob(id: number): MockJob | undefined {
  return MOCK_JOBS.find((job) => job.id === id)
}
