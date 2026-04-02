# FounderOS

> 创始人日程智能助手 - AI 驱动的日程避坑指南

## 背景

FounderOS 源于一次创始人与 AI 助手的深度对话。

**核心理念**：以日程为切入口，不打扰、不决策、只激发思考。

创始人每天被各种会议淹没，哪些会议真正重要？哪些坑需要提前避开？ FounderOS 通过分析日程，自动识别重要事项，给出实用的避坑建议。

## 功能特性

- 📅 **智能日程分析** - 自动识别重要日程（融资、招聘、法律、产品、团队、销售）
- 🏥 **健康度检查** - 分析时间分配，防止创始人"偏科"（只融资不做产品 / 只见客户不陪团队）
- 💬 **飞书集成** - 直接在飞书接收日程提醒
- ⏰ **每日自动** - 每天早上 8 点自动分析并推送
- ⚙️ **灵活配置** - 通过 Markdown 文档调整分析规则，无需改代码

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

# Claude API（可选，用于更智能的分析）
# 不配置则使用默认规则引擎
ANTHROPIC_API_KEY=sk-ant-api03-xxx
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

## 使用方式

1. 在飞书日历中添加日程
2. FounderOS 每天自动分析
3. 每天早上 8 点收到提醒
4. 重要日程会标注 ⭐ 和分类
5. 点击查看详细提示和鼓励的话

## 分析场景

| 类别 | 关键词 | 重要性 | 示例 |
|------|--------|--------|------|
| 💰 融资 | 融资、投资人、BP、Term Sheet | 85-95 | "与XX资本聊A轮" |
| ⚖️ 法律 | 律师、股权、合同 | 80-90 | "与李律师讨论股权架构" |
| 👥 招聘 | 面试、招聘、offer | 80-90 | "面试CTO" |
| 🤝 销售 | 客户、签约、销售 | 80-90 | "与潜在客户晚饭" |
| 📦 产品 | 产品、评审、路线图 | 75-85 | "产品路线图评审" |
| 👨‍👩‍👧‍👦 团队 | 团队、例会、1:1 | 70-80 | "团队周例会" |

## 健康度检查

FounderOS 会分析你的时间分配，检测以下问题：

- ⚠️ 融资占比 > 50%：融资固然重要，但产品才是根本
- ⚠️ 无产品评审：建议至少每两周一次
- ⚠️ 无团队 1:1：建议每周与核心成员沟通
- ⚠️ 无法律/股权会议：建议至少每月审阅一次

## 自定义分析规则

编辑 `knowledge-base.md` 文件即可调整分析逻辑：

```markdown
### 💰 融资相关 (fundraising)

**识别关键词**：融资、投资人、BP、Term Sheet...

**判断规则**：
- 重要性 85-95

**简要提示模板**：这是融资关键节点...

**鼓励的话**：投资人见多了项目，你有你的独特优势...
```

## 项目结构

```
founder-os/
├── src/
│   ├── app.ts              # 主应用
│   ├── cli.ts              # 命令行入口
│   ├── ai/analyzer.ts      # AI 分析引擎
│   ├── calendar/sync.ts    # 日历同步
│   └── notifier/feishu.ts  # 飞书消息推送
├── knowledge-base.md       # 分析知识库
├── .env.example            # 配置示例
└── package.json
```

## 技术栈

- TypeScript
- 飞书开放平台 API
- Claude API（可选）

## 许可证

MIT

## 作者

[dacm401](https://github.com/dacm401)

---

🦞 *Built with love for founders*
