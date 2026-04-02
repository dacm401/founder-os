# FounderOS

> 创始人日程智能助手 - AI 驱动的日程避坑指南

## 功能特性

- 📅 **智能日程分析** - 自动识别重要日程（融资、招聘、法律、产品、团队、销售）
- 🏥 **健康度检查** - 分析时间分配，防止创始人偏科
- 💬 **飞书集成** - 直接在飞书接收日程提醒
- ⚙️ **灵活配置** - 通过 Markdown 文档调整分析规则，无需改代码

## 快速开始

### 前置要求

- Node.js 18+
- 飞书开放平台应用权限

### 安装

```bash
git clone https://github.com/your-repo/founder-os.git
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
ANTHROPIC_API_KEY=sk-xxx
```

2. 配置飞书应用权限：
   - `calendar:calendar:readonly` - 读取日历
   - `calendar:event:readonly` - 读取日程

### 运行

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
node dist/index.js
```

### 定时任务

使用 cron 设置每日分析：

```bash
# 每天早上 8 点运行
0 8 * * * npm run start
```

## 使用方式

1. 在飞书日历中添加日程
2. FounderOS 自动分析重要性
3. 每天早上 8 点收到提醒
4. 点击星标日程查看详细提示

## 分析场景

| 类别 | 关键词 | 重要性 |
|------|--------|--------|
| 💰 融资 | 融资、投资人、BP、Term Sheet | 85-95 |
| ⚖️ 法律 | 律师、股权、合同 | 80-90 |
| 👥 招聘 | 面试、招聘、offer | 80-90 |
| 🤝 销售 | 客户、签约、销售 | 80-90 |
| 📦 产品 | 产品、评审、路线图 | 75-85 |
| 👨‍👩‍👧‍👦 团队 | 团队、例会、1:1 | 70-80 |

## 自定义分析规则

编辑 `knowledge-base.md` 文件即可调整分析逻辑：

```markdown
### 💰 融资相关 (fundraising)

**识别关键词**：融资、投资人、BP、Term Sheet...

**判断规则**：
- 重要性 85-95

**简要提示模板**：这是融资关键节点...
```

## 项目结构

```
founder-os/
├── src/
│   ├── app.ts              # 主应用
│   ├── ai/analyzer.ts     # AI 分析引擎
│   ├── calendar/sync.ts   # 日历同步
│   └── notifier/          # 消息推送
├── knowledge-base.md      # 分析知识库
├── .env.example           # 配置示例
└── package.json
```

## 许可证

MIT
