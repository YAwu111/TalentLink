"""初始化数据：管理员固定账号 + 可选演示数据，重复启动幂等。"""

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import (
    Application,
    ApplicationStatus,
    Company,
    Job,
    JobStatus,
    Role,
    Seeker,
    User,
    UserStatus,
)

DEMO_PASSWORD = "demo123"


def _get_user(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(User.username == username))


def _create_user(db: Session, username: str, password: str, role: Role) -> User:
    user = User(
        username=username,
        password_hash=hash_password(password),
        role=role,
        status=UserStatus.active,
    )
    db.add(user)
    db.flush()
    return user


def ensure_admin(db: Session) -> User:
    user = _get_user(db, settings.ADMIN_USERNAME)
    if user:
        return user
    user = _create_user(db, settings.ADMIN_USERNAME, settings.ADMIN_PASSWORD, Role.admin)
    db.commit()
    return user


def ensure_demo(db: Session) -> None:
    if _get_user(db, "hr_xinghe"):
        return

    # 企业一
    hr = _create_user(db, "hr_xinghe", DEMO_PASSWORD, Role.employer)
    company = Company(
        user_id=hr.id,
        name="星河科技有限公司",
        phone="021-58889000",
        address="上海市浦东新区张江路 88 号",
        intro="专注企业级 SaaS 产品研发，团队 200 人，已完成 B 轮融资。",
        industry="互联网/软件",
        verified=True,
    )
    db.add(company)
    db.flush()

    # 企业二
    hr2 = _create_user(db, "hr_lanwan", DEMO_PASSWORD, Role.employer)
    company2 = Company(
        user_id=hr2.id,
        name="蓝湾数据服务有限公司",
        phone="0755-86661234",
        address="深圳市南山区科技园南区 12 栋",
        intro="面向零售行业的数据分析与咨询服务商。",
        industry="大数据",
        verified=True,
    )
    db.add(company2)
    db.flush()

    # 岗位
    job_backend = Job(
        company_id=company.id,
        title="后端开发工程师",
        requirement="熟悉 Python / FastAPI，掌握 MySQL 与 Redis，具备 2 年以上接口开发经验。",
        other_requirement="有高并发系统经验者优先。",
        salary_min=15000,
        salary_max=25000,
        headcount=3,
        status=JobStatus.published,
        published_at=datetime.now(),
    )
    job_frontend = Job(
        company_id=company.id,
        title="前端开发工程师",
        requirement="熟悉 Vue 3 与 TypeScript，掌握工程化构建，能独立完成中后台页面。",
        other_requirement="有组件库建设经验者优先。",
        salary_min=13000,
        salary_max=22000,
        headcount=2,
        status=JobStatus.published,
        published_at=datetime.now() - timedelta(days=3),
    )
    job_data = Job(
        company_id=company2.id,
        title="数据分析师",
        requirement="熟练使用 SQL 与 Python 进行数据清洗与建模，能独立输出分析报告。",
        other_requirement="熟悉零售行业指标体系者优先。",
        salary_min=12000,
        salary_max=18000,
        headcount=1,
        status=JobStatus.published,
        published_at=datetime.now() - timedelta(days=5),
    )
    job_product = Job(
        company_id=company.id,
        title="产品经理",
        requirement="负责 B 端产品需求调研、方案设计与版本推进，能够与设计、研发、销售协同。",
        other_requirement="有 HR SaaS 产品经验者优先。",
        salary_min=18000,
        salary_max=30000,
        headcount=1,
        status=JobStatus.published,
        published_at=datetime.now() - timedelta(days=2),
    )
    job_java = Job(
        company_id=company2.id,
        title="Java 开发工程师",
        requirement="熟悉 Java、Spring Boot 与 MySQL，了解消息队列与分布式事务。",
        other_requirement="有金融行业系统经验者优先。",
        salary_min=16000,
        salary_max=28000,
        headcount=2,
        status=JobStatus.published,
        published_at=datetime.now() - timedelta(days=7),
    )
    job_ops = Job(
        company_id=company.id,
        title="运营专员",
        requirement="负责用户增长活动策划、社群运营与数据复盘，具备内容策划能力。",
        other_requirement="本科及以上学历，1 年以上运营经验。",
        salary_min=8000,
        salary_max=12000,
        headcount=2,
        status=JobStatus.published,
        published_at=datetime.now() - timedelta(days=9),
    )
    db.add_all(
        [job_backend, job_frontend, job_data, job_product, job_java, job_ops]
    )
    db.flush()

    # 求职者
    sk = _create_user(db, "seeker_liming", DEMO_PASSWORD, Role.seeker)
    seeker = Seeker(
        user_id=sk.id,
        name="李明",
        gender="男",
        birth_date=date(1999, 5, 12),
        phone="13800138000",
        email="liming@example.com",
        household="江苏省南京市",
        education="本科",
        major="软件工程",
        degree="工学学士",
        school="南京邮电大学",
        skills="Python、FastAPI、MySQL、Redis、Docker",
        job_intention="后端开发工程师",
        expected_salary_min=15000,
        expected_salary_max=25000,
        work_company="南京云杉软件有限公司",
        work_title="后端开发工程师",
        work_start="2021.07",
        work_end="至今",
        work_description="负责企业服务平台后端接口与数据同步，使用 FastAPI、MySQL、Redis 支撑核心业务。",
    )
    db.add(seeker)
    db.flush()

    sk2 = _create_user(db, "seeker_wangfang", DEMO_PASSWORD, Role.seeker)
    seeker2 = Seeker(
        user_id=sk2.id,
        name="王芳",
        gender="女",
        birth_date=date(2001, 8, 3),
        phone="13900139000",
        household="广东省深圳市",
        education="本科",
        major="统计学",
        degree="理学学士",
        school="深圳大学",
        skills="SQL、Python、Tableau、统计分析",
        job_intention="数据分析师",
        expected_salary_min=12000,
        expected_salary_max=18000,
        work_company="深圳数澜科技有限公司",
        work_title="数据分析师",
        work_start="2022.07",
        work_end="至今",
        work_description="负责零售客户经营分析、指标体系建设与可视化报表。",
    )
    db.add(seeker2)
    db.flush()

    # 投递
    db.add_all(
        [
            Application(
                job_id=job_backend.id,
                seeker_id=seeker.id,
                status=ApplicationStatus.viewed,
            ),
            Application(
                job_id=job_frontend.id,
                seeker_id=seeker.id,
                status=ApplicationStatus.submitted,
            ),
            Application(
                job_id=job_data.id,
                seeker_id=seeker.id,
                status=ApplicationStatus.interview,
                note="面试安排在周五下午。",
            ),
            Application(
                job_id=job_java.id,
                seeker_id=seeker.id,
                status=ApplicationStatus.rejected,
            ),
            Application(
                job_id=job_ops.id,
                seeker_id=seeker.id,
                status=ApplicationStatus.offered,
                note="已收到录用意向。",
            ),
            Application(
                job_id=job_data.id,
                seeker_id=seeker2.id,
                status=ApplicationStatus.submitted,
            ),
        ]
    )
    db.commit()


def run_seed(db: Session) -> None:
    ensure_admin(db)
    if settings.SEED_DEMO:
        ensure_demo(db)
