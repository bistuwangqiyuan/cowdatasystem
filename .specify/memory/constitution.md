<!--
Sync Impact Report:
Version: 2.0.0 → 2.1.0 (Minor Update)
Ratification Date: 2025-10-11
Last Amended: 2025-10-12
Changes:
  - ADDED Principle 13: SEO 优化与搜索可见性 (SEO Optimization & Search Visibility) (new)
  - Maintained all existing principles 1-12 without modifications
Templates Status:
  - plan-template.md: ⚠️ Requires update for SEO requirements
  - spec-template.md: ⚠️ Requires update for SEO standards
  - tasks-template.md: ⚠️ Requires update to include SEO optimization tasks
  - README.md: ⚠️ Requires update for SEO best practices
Follow-up TODOs:
  - Implement meta tags and structured data across all pages
  - Set up sitemap.xml and robots.txt
  - Configure Open Graph and Twitter Card metadata
  - Implement semantic HTML5 and ARIA attributes
  - Set up Google Analytics and Search Console
  - Optimize page load performance for Core Web Vitals
  - Create SEO-friendly URLs and content structure
Version Bump Rationale:
  - MINOR (2.1.0): New principle added without breaking existing requirements
  - No backward incompatible changes
  - Expands system capabilities to improve discoverability
  - Aligns with Jamstack performance benefits
-->

# 奶牛实验数据管理系统项目原则
# Cow Experiment Data Management System - Project Constitution

**版本 (Version):** 2.1.0  
**批准日期 (Ratification Date):** 2025-10-11  
**最后修订 (Last Amended):** 2025-10-12  
**项目类型 (Project Type):** Web Application (Jamstack)  
**部署平台 (Deployment):** Netlify  
**主要技术栈 (Tech Stack):** Astro/Next.js + Supabase + Tailwind CSS

---

## 项目愿景 (Project Vision)

奶牛实验数据管理系统旨在为奶牛养殖场提供一个现代化、高效的数据管理平台，实现对奶牛养殖全生命周期数据的系统化记录、分析和管理。通过 Jamstack 架构和云端部署，确保数据的安全性、可访问性和实时性，帮助养殖场提升管理效率和科学决策能力。

---

## 核心原则 (Core Principles)

### 原则 1：测试优先开发 (Test-First Development)
**强制性 (Mandatory)** | **⚠️ 已增强 - v2.0.0**

所有功能开发必须遵循测试优先开发流程：
- **测试先行：** 在编写任何功能代码之前，必须先编写对应的单元测试
- **覆盖率要求：** 测试覆盖率必须达到 **90% 以上**（语句、分支、函数覆盖率）
- **核心模块：** 核心业务逻辑模块（数据服务层、关键计算）要求 **95% 以上**
- **测试结构：** 测试文件位于 `/tests` 目录，镜像主应用结构
- **测试类型：** 每个功能至少包含：
  - 1 个正常用例（Happy Path）
  - 1 个边界用例（Edge Case）
  - 1 个失败用例（Error Handling）
- **CI/CD：** 所有测试必须通过才能部署，失败的构建自动回滚
- **测试工具：** 单元测试（Vitest/Jest）、集成测试（Playwright）、API 测试（Supertest）

**理由 (Rationale):**  
养殖数据直接影响决策和经济效益，错误可能导致重大损失。90% 的覆盖率确保系统可靠性，减少生产环境 bug，提升用户信任度。

---

### 原则 2：详细文档注释 (Comprehensive Documentation)
**强制性 (Mandatory)**

所有代码必须包含详细的文档注释：
- 每个函数/方法必须有 JSDoc/TSDoc 注释，说明用途、参数、返回值
- 复杂逻辑必须添加内联注释，使用 `// Reason:` 说明设计决策
- 组件必须注明 Props 类型和使用示例
- API 端点必须注明请求/响应格式、错误码
- 数据库模型必须注释每个字段的业务含义
- README.md 必须保持更新，记录新功能、依赖变更、设置步骤
- **新增：** 所有公共 API 必须提供 OpenAPI/Swagger 文档

**理由 (Rationale):**  
系统涉及复杂的养殖业务逻辑，详细文档确保团队成员和未来维护者能够快速理解代码意图，降低维护成本。

---

### 原则 3：Jamstack 架构 (Jamstack Architecture)
**强制性 (Mandatory)**

项目必须严格遵循 Jamstack 架构原则：
- **静态优先：** 所有可预渲染的页面必须静态生成（SSG）
- **API 解耦：** 后端功能通过 Netlify Functions 和 Supabase 实现
- **无服务器：** 禁止使用传统服务器或数据库（除 Supabase）
- **CDN 分发：** 所有静态资源通过 Netlify CDN 分发
- **渐进增强：** 核心功能在无 JavaScript 环境下可用
- **性能优先：** 首屏加载时间 < 2s，Lighthouse 性能评分 > 90

**技术选型限制：**
- 前端框架：Astro（推荐）或 Next.js
- 数据库：Supabase（PostgreSQL + 实时订阅）
- 样式：Tailwind CSS
- 部署：Netlify（唯一允许的部署平台）

**理由 (Rationale):**  
Jamstack 提供卓越的性能、安全性和可维护性，适合养殖场在各种网络环境下使用。无服务器架构降低运维成本，Supabase 提供实时数据能力。

---

### 原则 4：完整的日志与审计 (Comprehensive Logging & Auditing)
**强制性 (Mandatory)** | **⚠️ 已增强 - v2.0.0**

所有用户交互、系统事件和数据变更必须被记录和追踪：

**应用日志：**
- 用户提交的表单数据必须保存到 Supabase 数据库
- 重要操作（增删改）必须记录到审计日志表
- 用户反馈、问题报告必须以 Markdown 格式存储
- 每条记录必须包含：用户 ID、时间戳、操作类型、IP 地址（可选）

**系统监控日志：**
- 应用错误和异常必须记录到日志系统
- API 请求/响应必须记录响应时间、状态码、错误详情
- 数据库查询性能必须被监控和记录
- 系统资源使用（CPU、内存、网络）必须定期记录

**安全与隐私：**
- 敏感数据必须加密存储，符合数据保护法规
- 日志保留期限：操作日志 1 年，审计日志永久，系统日志 3 个月

**理由 (Rationale):**  
养殖数据具有长期价值，完整的记录有助于追溯问题、分析趋势、满足合规要求。系统日志对于故障排查和性能优化至关重要。

---

### 原则 5：数据安全与隐私 (Data Security & Privacy)
**强制性 (Mandatory)**

数据安全是不可妥协的核心要求：
- **认证授权：** 使用 Supabase Auth，支持行级安全（RLS）
- **权限分级：** 管理员、养殖员、访客三级权限体系
- **数据加密：** 传输层 HTTPS，静态数据库级加密
- **访问控制：** 敏感数据（如经济数据）限制访问权限
- **备份策略：** Supabase 自动备份 + 每周手动备份验证
- **隐私合规：** 遵守 GDPR/PIPL，提供数据导出/删除功能

**禁止事项：**
- 在客户端代码中硬编码 API 密钥
- 将敏感日志提交到 Git 仓库
- 在公共网络传输未加密的养殖数据

**理由 (Rationale):**  
养殖数据可能包含商业机密（育种配方、经济数据等），数据泄露可能导致竞争劣势或法律风险。

---

### 原则 6：移动优先设计 (Mobile-First Design)
**强制性 (Mandatory)**

所有界面必须采用移动优先的响应式设计：
- **设计流程：** 先设计移动端（320px 宽度），再适配桌面端
- **触控优化：** 按钮最小尺寸 44x44px，表单输入易用
- **离线支持：** 核心数据查看功能支持离线缓存（Service Worker）
- **网络优化：** 图片懒加载、资源压缩、最小化请求数量
- **实地测试：** 在养殖场实际环境（可能信号较弱）测试可用性

**响应式断点：**
- 移动端：320px - 768px（主要目标）
- 平板：769px - 1024px
- 桌面：1025px+

**理由 (Rationale):**  
养殖员需要在牛舍、饲料房等现场环境记录数据，移动设备是主要使用场景。移动优先确保核心功能在资源受限环境下可用。

---

### 原则 7：实时数据同步 (Real-Time Data Sync)
**强制性 (Mandatory)**

系统必须支持实时数据同步和协作：
- 使用 Supabase Realtime 订阅数据库变更
- 多用户同时操作时，数据变更立即推送到所有客户端
- 关键数据（如奶牛健康状态）变更时，触发实时通知
- 冲突解决策略：最后写入优先，带版本号和时间戳
- 网络断开时，本地缓存数据并在恢复后同步

**实时数据类型：**
- 奶牛健康监测数据（体温、活动量）
- 饲料库存变动
- 产奶量记录
- 紧急事件通知

**理由 (Rationale):**  
养殖场是多人协作环境，实时同步避免数据冲突，确保决策基于最新信息。健康监测数据的实时性可能影响及时治疗。

---

### 原则 8：数据可追溯性 (Data Traceability)
**强制性 (Mandatory)**

所有数据变更必须可追溯和审计：
- **版本控制：** 关键业务数据（奶牛档案、配种记录）保留历史版本
- **审计日志：** 记录每次 CRUD 操作的用户、时间、变更内容
- **变更对比：** 支持查看数据变更前后的差异
- **不可删除：** 历史数据只能标记为"已归档"，不可物理删除
- **追溯周期：** 奶牛全生命周期数据永久保留，操作日志至少 3 年

**实现方式：**
- Supabase 数据库触发器记录变更到 `audit_logs` 表
- 关键表使用 `created_at`, `updated_at`, `updated_by` 字段
- 软删除模式：`deleted_at` 字段标记删除，不执行 DELETE

**理由 (Rationale):**  
养殖数据用于科研、育种改良、疾病追踪等长期分析。完整的历史记录有助于发现规律、追溯问题根源、满足监管要求。

---

### 原则 9：清晰的用户指导 (Clear User Guidance & Documentation)
**强制性 (Mandatory)**

所有用户交互界面和文档必须提供清晰、完整、可操作的指导：
- **操作提示：** 每个功能必须包含简洁明了的使用说明
- **可点击链接：** 所有引用的资源、文档、配置页面必须提供直接可点击的超链接
- **错误处理：** 错误消息必须包含：
  - 问题的清晰描述
  - 可能的原因分析
  - 具体的解决步骤（带编号）
  - 相关文档链接
- **分步指南：** 复杂操作必须提供逐步指导，每步包含：
  - 明确的操作说明
  - 预期结果描述
  - 失败时的备选方案
- **快速访问：** README 和文档必须包含：
  - 快速开始链接（直达配置页面）
  - 常见问题解答（FAQ）链接
  - 故障排查指南链接
- **可视化辅助：** 关键流程提供截图、图表或视频教程链接

**文档标准：**
- 所有 URL 使用完整的 `https://` 格式，确保可点击
- 内部文档使用相对路径或仓库链接
- 外部服务（Supabase Dashboard、Netlify）提供直达特定页面的深链接
- 示例命令提供可直接复制的代码块

**用户体验要求：**
- 新用户应能在 5 分钟内完成首次配置（借助清晰的指导）
- 错误信息应让用户明确知道"下一步做什么"
- 避免使用技术术语时不解释或不提供参考链接

**理由 (Rationale):**  
养殖场用户可能缺乏技术背景，清晰详细的指导降低学习曲线和支持成本。可点击的链接消除用户手动搜索的摩擦，提高操作成功率和用户满意度。

---

### 原则 10：代码质量保证 (Code Quality Assurance)
**强制性 (Mandatory)** | **🆕 新增 - v2.0.0**

所有代码必须符合严格的质量标准：

**代码规范：**
- 必须使用 ESLint + Prettier 进行代码格式化和风格检查
- TypeScript 严格模式 (`strict: true`)，禁止使用 `any` 类型
- 遵循 Airbnb JavaScript Style Guide 或项目定制规范
- 所有 Pull Request 必须通过 Linter 检查才能合并

**代码审查：**
- 所有代码必须经过至少 1 人的 Code Review
- 关键模块（数据服务、权限控制）需要 2 人审查
- 审查重点：逻辑正确性、安全漏洞、性能问题、可读性

**静态分析：**
- 使用 SonarQube 或类似工具进行静态代码分析
- 代码复杂度（Cyclomatic Complexity）不得超过 15
- 代码重复率不得超过 3%
- 必须修复所有 Critical 和 High 级别的代码异味

**性能标准：**
- 函数执行时间不得超过 100ms（数据库查询除外）
- API 响应时间 < 500ms（P95）
- 前端页面加载时间 < 2s（3G 网络）
- 内存泄漏监控和定期检查

**理由 (Rationale):**  
高质量的代码减少 bug、提升可维护性、降低长期成本。自动化工具确保一致性，人工审查捕获工具无法发现的逻辑问题。

---

### 原则 11：RESTful API 设计标准 (RESTful API Design Standards)
**强制性 (Mandatory)** | **🆕 新增 - v2.0.0**

所有 API 必须遵循 RESTful 设计原则和行业最佳实践：

**资源命名：**
- 使用名词复数形式表示资源：`/api/cows`, `/api/health-records`
- 使用小写字母和连字符（kebab-case），避免下划线
- 资源层次结构：`/api/cows/{id}/health-records`
- 禁止使用动词：❌ `/api/getCow` ✅ `GET /api/cows/{id}`

**HTTP 方法：**
- `GET` - 获取资源（幂等、安全）
- `POST` - 创建资源（非幂等）
- `PUT` - 完整更新资源（幂等）
- `PATCH` - 部分更新资源（幂等）
- `DELETE` - 删除资源（幂等）

**状态码规范：**
- `200 OK` - 成功获取/更新
- `201 Created` - 成功创建，返回 `Location` 头
- `204 No Content` - 成功删除或无内容返回
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证
- `403 Forbidden` - 无权限
- `404 Not Found` - 资源不存在
- `409 Conflict` - 资源冲突
- `422 Unprocessable Entity` - 业务逻辑验证失败
- `500 Internal Server Error` - 服务器错误

**响应格式：**
```json
{
  "data": { ... },           // 成功时的数据
  "error": {                 // 失败时的错误信息
    "code": "VALIDATION_ERROR",
    "message": "Invalid cow number format",
    "details": { ... }
  },
  "meta": {                  // 分页、版本等元数据
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

**版本控制：**
- URL 版本控制：`/api/v1/cows`
- 向后兼容，至少支持 2 个主版本
- 废弃通知：在响应头中添加 `Deprecated: true`

**安全要求：**
- 所有 API 必须使用 HTTPS
- 实现速率限制（Rate Limiting）：100 req/min per user
- 使用 JWT 或 OAuth 2.0 进行认证
- 敏感操作需要 CSRF 保护

**文档要求：**
- 使用 OpenAPI 3.0 规范编写 API 文档
- 提供 Swagger UI 或 Redoc 在线文档
- 每个端点必须包含：描述、请求/响应示例、错误码说明

**理由 (Rationale):**  
标准化的 API 设计提升开发效率、减少沟通成本、便于第三方集成。RESTful 原则是业界公认的最佳实践，降低学习曲线。

---

### 原则 12：监控与可观测性 (Monitoring and Observability)
**强制性 (Mandatory)** | **🆕 新增 - v2.0.0**

系统必须实现完整的监控和可观测性基础设施：

**应用性能监控 (APM)：**
- 使用 Sentry、New Relic 或类似工具监控应用错误和性能
- 实时追踪错误率、响应时间、吞吐量
- 自动捕获和报告 JavaScript 错误、API 错误、数据库错误
- 设置告警阈值：错误率 > 1%、响应时间 > 1s

**基础设施监控：**
- 监控 Netlify 函数执行时间、内存使用、冷启动频率
- 监控 Supabase 数据库连接池、查询性能、存储使用
- CDN 性能监控：缓存命中率、边缘响应时间

**业务指标监控：**
- 用户活跃度：DAU、MAU、会话时长
- 功能使用率：各模块访问量、操作完成率
- 数据质量：记录完整性、异常数据比例
- 系统健康：数据同步延迟、实时连接数

**日志聚合：**
- 集中收集应用日志、访问日志、错误日志
- 使用 ELK Stack (Elasticsearch + Logstash + Kibana) 或 Datadog
- 日志结构化（JSON 格式），包含：时间戳、级别、模块、消息、上下文
- 支持全文搜索、过滤、聚合分析

**告警机制：**
- 关键错误立即通知（邮件 + Slack/钉钉）
- 性能降级提前预警
- 业务异常自动检测（如产奶量突降）
- 定期生成健康报告（周报、月报）

**可视化大屏：**
- 实时监控大屏展示核心指标
- 自定义仪表板支持不同角色（运维、业务）
- 历史趋势图表，支持时间范围选择

**理由 (Rationale):**  
完整的监控体系是保障系统稳定运行的基础。及时发现和解决问题，避免小问题演变成重大故障。数据驱动的运维决策提升系统可靠性和用户满意度。

---

### 原则 13：SEO 优化与搜索可见性 (SEO Optimization & Search Visibility)
**强制性 (Mandatory)** | **🆕 新增 - v2.1.0**

系统必须实现全面的 SEO 优化，确保内容在搜索引擎中的可见性和排名：

**页面元数据：**
- 每个页面必须包含唯一、描述性的 `<title>`（50-60 字符）
- 每个页面必须包含 `<meta name="description">`（150-160 字符）
- 使用规范的 `<link rel="canonical">` 避免重复内容
- 实现多语言支持的 `<link rel="alternate" hreflang="...">`
- 设置适当的 `<meta name="robots">` 控制索引策略

**结构化数据 (Schema.org)：**
- 使用 JSON-LD 格式实现结构化数据标记
- 关键页面类型：
  - 首页：`Organization` / `WebSite`
  - 奶牛档案：`LivestockAnimal` / `Product`
  - 数据分析：`Dataset` / `Report`
  - 文章/帮助：`Article` / `FAQPage`
- 通过 Google Rich Results Test 验证标记正确性

**Open Graph 与社交媒体：**
- 实现 Open Graph 协议（`og:title`, `og:description`, `og:image`, `og:url`）
- 实现 Twitter Card 标记（`twitter:card`, `twitter:title`, `twitter:description`）
- 提供高质量的社交分享图片（1200x630px，< 1MB）
- 确保社交分享时显示正确的预览内容

**技术 SEO：**
- 实现 `sitemap.xml`，包含所有可索引页面，提交到 Google Search Console
- 配置 `robots.txt`，合理控制爬虫访问
- 使用语义化 HTML5 标签（`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`）
- 实现面包屑导航（Breadcrumbs）并添加结构化数据
- 确保所有链接使用描述性锚文本，避免"点击这里"

**性能优化（Core Web Vitals）：**
- **LCP (Largest Contentful Paint)** < 2.5s：优化关键渲染路径，预加载关键资源
- **FID (First Input Delay)** < 100ms：最小化 JavaScript 执行时间，代码分割
- **CLS (Cumulative Layout Shift)** < 0.1：为图片/iframe 设置明确尺寸，避免动态内容插入
- 使用 `<link rel="preload">` 预加载关键字体和图片
- 实现响应式图片（`<picture>`, `srcset`）和 WebP 格式

**内容优化：**
- 使用清晰的标题层次（H1 → H2 → H3），每页只有一个 H1
- 关键词自然融入标题、正文、图片 alt 属性
- 内部链接策略：相关页面互相链接，提升页面权重传递
- 图片必须包含描述性 `alt` 属性（无障碍 + SEO）
- URL 使用语义化路径（`/cows/holstein-001` 而非 `/item?id=123`）

**移动友好性：**
- 通过 Google Mobile-Friendly Test 验证
- 视口配置：`<meta name="viewport" content="width=device-width, initial-scale=1">`
- 触控元素间距至少 48x48px，避免误触
- 避免使用不兼容移动端的技术（Flash、固定宽度布局）

**国际化与本地化：**
- 实现 `hreflang` 标签，指示页面语言和地区变体
- URL 结构：`/zh-CN/cows`, `/en-US/cows`
- 避免自动重定向，让用户选择语言/地区
- 提供语言切换器，并在搜索引擎中正确索引

**分析与监控：**
- 集成 Google Analytics 4 (GA4)，追踪用户行为和转化
- 配置 Google Search Console，监控索引状态和搜索性能
- 定期检查：
  - 索引覆盖率（Coverage Report）
  - 搜索查询和点击率（Performance Report）
  - 移动可用性问题（Mobile Usability）
  - Core Web Vitals 得分
- 设置告警：索引错误、搜索流量异常下降

**安全与信任：**
- 全站 HTTPS（搜索引擎优先排名 HTTPS 网站）
- 实现安全头：`X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`
- 避免混合内容（Mixed Content）错误
- 定期更新依赖，修复安全漏洞

**禁止事项：**
- ❌ 关键词堆砌（Keyword Stuffing）
- ❌ 隐藏文本或链接（Cloaking）
- ❌ 购买反向链接或参与链接农场（Link Farms）
- ❌ 内容抄袭或自动生成低质量内容
- ❌ 使用欺骗性重定向或隐藏页面

**理由 (Rationale):**  
Jamstack 架构天然适合 SEO（静态页面、快速加载、CDN 分发）。良好的 SEO 提升系统在搜索引擎中的可见性，帮助潜在用户发现产品，扩大用户基础。结构化数据和社交分享优化提升品牌形象和信任度。性能优化不仅改善 SEO 排名，也提升用户体验和转化率。

---

## 治理框架 (Governance)

### 修订程序 (Amendment Process)
本原则文档的修订必须经过以下流程：
1. 提出修订建议（GitHub Issue 或团队会议）
2. 团队讨论和投票（至少 2/3 多数通过）
3. 更新本文档并递增版本号
4. 同步更新相关模板和文档
5. 通知所有团队成员

### 版本控制 (Versioning)
- **主版本 (MAJOR):** 移除或重新定义核心原则、增加强制性要求
- **次版本 (MINOR):** 新增原则或重大扩展
- **修订版 (PATCH):** 澄清、修正措辞、非语义修改

### 合规审查 (Compliance Review)
- 每个 Pull Request 必须经过原则合规性检查
- 每季度进行一次全面的原则遵守审计
- 违反强制性原则的代码不得合并到主分支

---

## 附录：数据管理范围 (Appendix: Data Management Scope)

奶牛实验数据管理系统需管理以下数据类型：

### 基础档案数据
- 奶牛基本信息（编号、品种、出生日期、系谱）
- 养殖场信息（场地、分区、设备）
- 人员信息（养殖员、兽医）

### 日常管理数据
- 饲料配方与投喂记录
- 健康检查与疫苗接种
- 产奶量与质量数据
- 行为观察记录

### 繁殖数据
- 发情监测
- 配种记录
- 妊娠检查
- 产犊信息

### 经济数据
- 成本核算（饲料、人工、医疗）
- 产出收益（奶量、犊牛销售）
- 投入产出比分析

### 科研数据
- 实验设计与分组
- 数据采集与观测
- 统计分析结果
- 论文与报告

---

**文档维护者 (Document Maintainer):** 项目负责人  
**下次审查日期 (Next Review Date):** 2026-04-12
