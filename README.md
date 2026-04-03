# FounderOS

> 创始人日程智能助手 - AI 驱动的日程避坑指南

## 背景

FounderOS 源于一次创始人与 AI 助手的深度对话。

**核心理念**：以日程为切入口，不打扰、不决策、只激发思考。

创始人每天被各种会议淹没，哪些会议真正重要？哪些坑需要提前避开？ FounderOS 通过 AI 智能分析日程，自动识别重要事项，给出实用的避坑建议。

## 功能特性

- 🤖 **AI 智能分析** - 用大模型理解日程语义，生成个性化提醒（不再是关键词匹配）
- 📅 **智能日程分析** - 自动识别重要日程（融资、招聘、法律、产品、团队、销售、财务、个人）
- 🏥 **健康度检查** - 分析时间分配，防止创始人"偏科"
- 💬 **飞书集成** - 直接在飞书接收日程提醒
- ⏰ **每日自动** - 每天早上 8 点自动分析并推送

## 核心原则

> **不打扰**：只在真正重要的日程出现时提醒
> 
> **不决策**：只给思考框架，不替创始人拍板
> 
> **不越界**：只分析日程元数据（标题、时间），不分析内容细节

## 快速开始

### 前置要求

- Node.js 18+
- 飞书开放平台应用权限
- Anthropic API Key（用于 AI 分析）

### 安装

```bash
git clone https://github.com/dacm401/founder-os.git
cd founder-os
npm install
```

### 配置

1. 创建 `.env` 文件：

```bash
# 飞书配置
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_CALENDAR_ID=your_calendar_id

# Claude API（必填，用于AI智能分析）
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# 用户 Open ID（用于发送消息）
USER_OPEN_ID=ou_xxx
```

2. 配置飞书应用权限：
   - `calendar:calendar:readonly` - 读取日历
   - `calendar:event:readonly` - 读取日程
   - `im:message.send_as_user` - 发送消息提醒

### 运行

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
node dist/app.js
```

### 定时任务

推荐使用 cron 设置每日分析：

```bash
# 每天早上 8 点运行（北京时间）
0 8 * * * cd /path/to/founder-os && npm run start
```

## 工作原理

### 旧版本：关键词匹配

```
日程 → 关键词匹配 → 返回预设的建议
```

**问题**：规则难扩展、无法理解语义、建议千篇一律

### 新版本：AI 智能生成

```
日程 + 上下文 → Prompt → 大模型 → 个性化提醒
```

**优势**：
- 语义理解，不依赖关键词
- 针对每个日程生成独特建议
- 通过调整 prompt 随时改进分析逻辑

### Prompt 工程

```markdown
你是FounderOS，一个专注于创始人成长的AI助手。

## 创始人背景
- 科技行业创业者，技术出身
- 刚拿到融资，需要注意股权稀释和团队扩张

## 日程信息
- 标题：{title}
- 时间：{startTime}
- 描述：{description}

## 任务
请分析这个日程，生成JSON格式的智能提醒：
{
  "importance": 评分(0-100),
  "category": "分类",
  "briefTip": "一句话提醒",
  "detailedExplanation": "详细建议",
  "encouragement": "鼓励的话"
}
```

## 分析场景

| 类别 | 说明 | 重要性 |
|------|------|--------|
| 💰 融资 | 投资人、BP、尽调 | 85-95 |
| ⚖️ 法律 | 股权、合同、合规 | 80-90 |
| 👥 招聘 | 面试、offer、入职 | 80-90 |
| 🤝 销售 | 客户、签约、商务 | 80-90 |
| 📦 产品 | 评审、路线图、技术 | 75-85 |
| 👨‍👩‍👧‍👦 团队 | 例会、1:1、周会 | 70-80 |
| 💵 财务 | 税务、预算、现金流 | 75-90 |
| 🧘 个人 | 学习、健身、教练 | 60-75 |

## 健康度检查

FounderOS 会分析你的时间分配，检测以下问题：

- ⚠️ 融资占比 > 50%：融资固然重要，但产品才是根本
- ⚠️ 无产品评审：建议至少每两周一次
- ⚠️ 无团队 1:1：建议每周与核心成员沟通
- ⚠️ 无法律/股权会议：建议至少每月审阅一次
- ⚠️ 无财务沟通：建议每月与财务深入沟通
- ⚠️ 无个人时间：建议每周安排学习/运动时间

## 项目结构

```
founder-os/
├── src/
│   ├── app.ts              # 主应用
│   ├── cli.ts              # 命令行入口
│   ├── ai/analyzer.ts      # AI 分析引擎
│   ├── calendar/sync.ts    # 日历同步
│   └── notifier/feishu.ts  # 飞书消息推送
├── .env.example            # 配置示例
└── package.json
```

## 技术栈

- TypeScript
- 飞书开放平台 API
- Anthropic Claude API

## 许可证

MIT

## 作者

[dacm401](https://github.com/dacm401)

---

🦞 *Built with love for founders*
