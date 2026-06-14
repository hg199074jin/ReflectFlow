# ReflectFlow

本地优先的个人复盘工作台。每日打卡记录工作、学习与副业，通过结构化复盘方法深度反思，结合 AI 辅助分析，把每一天变成可复用的成长经验。

## 快速开始

### 环境要求

- Node.js >= 18

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开终端输出的本地地址（通常是 `http://localhost:5173`）。

### 构建生产版本

```bash
npm run build
npm run preview  # 预览构建结果
```

## 功能概览

### 录入模式

- 每日记录工作、学习、副业三类要点
- AI 复盘：生成引导问题，辅助深度反思
- AI 生成每日反思总结

### 查看模式

| 视图 | 说明 |
|------|------|
| **Timeline** | 按日期倒序展示记录，支持按月浏览 |
| **Gantt** | 按项目/主题可视化时间分布 |
| **Stats** | 热力图、活动分布、连续打卡天数 |
| **Reviews** | 五步结构化复盘（梳理过程 → 回顾目标 → 评估结果 → 分析原因 → 总结经验） |
| **Goals** | 周/月目标管理，关联每日记录 |
| **Preview** | 事前沙盘推演（PDF 循环的第一步） |
| **Reports** | 10 种报告模板，支持 AI 生成 |
| **Insights** | 趋势洞察与异常检测 |
| **Knowledge** | 原则库，沉淀可复用的个人工作原则 |

### AI 配置（可选）

点击右上角 **Settings**，配置任意 OpenAI 兼容的 LLM 提供商：

| 提供商 | Base URL |
|--------|----------|
| OpenAI | `https://api.openai.com/v1` |
| Ollama | `http://localhost:11434/v1` |
| 其他兼容 API | 自定义地址 |

不配置 AI 时，所有核心功能仍可正常使用。

### 数据导出

点击 **Export** 导出 Markdown 格式的 ZIP 包，支持自定义日期范围和目录结构。

## 技术栈

- React 19 + TypeScript
- Vite
- Zustand（状态管理）
- IndexedDB（本地存储）
- Zod（数据校验）
- react-markdown + remark-gfm
- Vitest + Testing Library + Playwright

## 项目结构

```
src/
├── components/          # UI 组件
│   ├── cards/           # 日记卡片、编辑器
│   ├── dialogs/         # 弹窗（导出、设置）
│   ├── nav/             # 导航栏
│   ├── primitives/      # 基础 UI 组件
│   ├── stats/           # 统计图表
│   └── views/           # 页面视图
├── features/            # 业务功能模块
│   ├── coach/           # AI 复盘教练
│   ├── evidence/        # 证据管理
│   ├── goals/           # 目标管理
│   ├── insights/        # 趋势洞察
│   ├── projects/        # 项目/主题管理
│   └── reports/         # 报告生成
├── lib/                 # 工具函数与类型定义
├── services/            # 外部服务（LLM、导出）
├── store/               # Zustand 状态管理
└── test/                # 测试配置与 fixtures
```

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 构建 |
| `npm run preview` | 预览生产构建 |
| `npm test` | 运行单元测试 |
| `npm run test:watch` | 监视模式运行测试 |
| `npm run e2e` | 运行端到端测试 |

## 许可证

MIT
