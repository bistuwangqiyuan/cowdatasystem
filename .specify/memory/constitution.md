<!--
Sync Impact Report:
Version: 1.0.0 → 1.1.0 (Minor Update)
Ratification Date: 2025-10-11
Last Amended: 2025-10-12
Changes:
  - Added Principle 9: Clear User Guidance & Documentation
  - Enhanced user experience requirements with actionable links and detailed instructions
  - Maintained all existing 8 principles (no modifications)
Templates Status:
  - plan-template.md: ✅ Aligned with new UX principle
  - spec-template.md: ✅ Updated to include user guidance requirements
  - tasks-template.md: ✅ Added task categories for user documentation
  - commands/: ✅ All commands verified for clear output
Follow-up TODOs:
  - Review all existing error messages for actionable links
  - Update README.md with clickable quick-start links
  - Add interactive troubleshooting guides
Version Bump Rationale:
  - MINOR (1.1.0): New principle added without breaking existing governance
  - No backward incompatible changes
  - Enhances existing documentation standards (Principle 2)
-->

# 奶牛实验数据管理系统项目原则
# Cow Experiment Data Management System - Project Constitution

**版本 (Version):** 1.1.0  
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

### 原则 1：测试驱动开发 (Test-Driven Development)
**强制性 (Mandatory)**

所有功能开发必须遵循测试驱动开发（TDD）流程：
- 在编写任何功能代码之前，必须先编写对应的单元测试
- 每个模块、组件、API 端点都必须有对应的自动化测试
- 测试覆盖率必须达到最低 80%，核心业务逻辑模块要求 95% 以上
- 测试文件位于 `/tests` 目录，镜像主应用结构
- 每个功能至少包含：1 个正常用例、1 个边界用例、1 个失败用例
- CI/CD 流程中所有测试必须通过才能部署

**理由 (Rationale):**  
养殖数据直接影响决策和经济效益，错误可能导致重大损失。TDD 确保代码质量和系统可靠性，减少生产环境 bug。

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

### 原则 4：用户输入记录 (User Input Logging)
**强制性 (Mandatory)**

所有用户交互和输入必须被记录和追踪：
- 用户提交的表单数据必须保存到 Supabase 数据库
- 重要操作（增删改）必须记录到审计日志表
- 用户反馈、问题报告必须以 Markdown 格式存储
- 每条记录必须包含：用户 ID、时间戳、操作类型、IP 地址（可选）
- 敏感数据必须加密存储，符合数据保护法规
- 日志保留期限：操作日志 1 年，审计日志永久

**理由 (Rationale):**  
养殖数据具有长期价值，完整的记录有助于追溯问题、分析趋势、满足合规要求。Markdown 格式便于人工审查和版本控制。

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
养殖场用户可能缺乏技术背景，清晰详细的指导降低学习曲线和支持成本。可点击的链接消除用户手动搜索的摩擦，提高操作成功率和用户满意度。完整的错误处理减少因模糊信息导致的重复问题反馈。

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
- **主版本 (MAJOR):** 移除或重新定义核心原则
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
