import { CalendarEvent, AnalysisResult } from '../types'
import OpenAI from 'openai'

// 初始化大模型客户端（支持 OpenAI 兼容格式）
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.SILICONFLOW_API_KEY
  const baseURL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1'
  
  return new OpenAI({
    apiKey: apiKey || 'dummy-key',
    baseURL
  })
}

/**
 * 生成智能分析 Prompt
 */
function buildAnalysisPrompt(event: CalendarEvent): string {
  const title = event.title || '无标题'
  const description = event.description || '无描述'
  const startTime = new Date(event.startTime).toLocaleString('zh-CN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `你是FounderOS，一个专注于创始人成长的AI助手。

## 创始人背景
- 科技行业创业者，技术出身
- 刚拿到融资，需要注意股权稀释和团队扩张
- 关注产品优先级和商业化

## 日程信息
- 标题：${title}
- 时间：${startTime}
- 描述：${description}

## 任务
请分析这个日程，生成JSON格式的智能提醒：

{
  "importance": 评分(0-100),
  "category": "分类(fundraising/legal/hiring/sales/product/team/finance/personal/other)",
  "briefTip": "一句话提醒(不超过20字)",
  "detailedExplanation": "详细建议(50-100字，针对这个具体日程)",
  "encouragement": "一句鼓励的话"
}

注意：
- 直接返回JSON，不要其他内容
- 如果日程信息太少无法分析，category设为"other"，importance设为50
- 建议要具体针对这个日程，不要泛泛而谈
- 风格：直接、有洞察、不说废话`
}

/**
 * 解析大模型返回的 JSON
 */
function parseAIResponse(text: string): Partial<AnalysisResult> {
  try {
    // 尝试提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        importance: typeof parsed.importance === 'number' ? parsed.importance : 50,
        category: parsed.category || 'other',
        briefTip: parsed.briefTip || '',
        detailedExplanation: parsed.detailedExplanation || '',
        encouragement: parsed.encouragement || ''
      }
    }
  } catch (e) {
    console.error('解析AI响应失败:', e)
  }
  return null
}

/**
 * 用大模型分析单个日程
 */
async function analyzeWithAI(event: CalendarEvent): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(event)
  
  try {
    const client = getOpenAIClient()
    
    const response = await client.chat.completions.create({
      model: process.env.AI_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
      messages: [
        { role: 'system', content: '你是一个专注于创始人成长的AI助手，擅长分析日程对创始人的影响，给出有洞察的建议。直接返回JSON。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })
    
    const text = response.choices[0]?.message?.content || ''
    
    const result = parseAIResponse(text)
    
    if (result && result.category) {
      return {
        importance: result.importance || 50,
        category: result.category,
        briefTip: result.briefTip || '这是一个需要关注的日程',
        detailedExplanation: result.detailedExplanation || '请根据日程内容自行判断',
        encouragement: result.encouragement || '相信你的判断'
      }
    }
  } catch (error) {
    console.error('AI分析失败:', error)
  }
  
  // AI 失败时返回默认分析
  return generateDefaultAnalysis(event)
}

/**
 * 默认分析（当AI不可用时）
 */
function generateDefaultAnalysis(event: CalendarEvent): AnalysisResult {
  const title = event.title || ''
  
  return {
    importance: 50,
    category: 'other',
    briefTip: '这个日程需要你自行判断重要性',
    detailedExplanation: '根据日程内容，我无法准确判断重要性。你可以思考：1）这个会议是否影响公司关键决策？2）是否涉及重要合作伙伴？3）是否有时间敏感性？',
    encouragement: '相信你的直觉。你是最了解公司情况的人。'
  }
}

/**
 * 分析单个日程 - 智能版本
 */
export async function analyzeEvent(event: CalendarEvent, knowledgeBase?: string): Promise<AnalysisResult> {
  // 检查是否有 API Key
  const apiKey = process.env.OPENAI_API_KEY || process.env.SILICONFLOW_API_KEY
  if (!apiKey) {
    console.warn('未配置 OPENAI_API_KEY 或 SILICONFLOW_API_KEY，使用默认分析')
    return generateDefaultAnalysis(event)
  }
  
  // 使用 AI 分析
  return analyzeWithAI(event)
}

/**
 * 批量分析日程 - 带并发控制
 */
export async function analyzeCalendar(
  events: CalendarEvent[], 
  knowledgeBase?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, AnalysisResult>> {
  const results = new Map<string, AnalysisResult>()
  const concurrency = 3 // 并发数
  
  for (let i = 0; i < events.length; i += concurrency) {
    const batch = events.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (event) => {
        const analysis = await analyzeEvent(event, knowledgeBase)
        return { id: event.id, analysis }
      })
    )
    
    for (const { id, analysis } of batchResults) {
      results.set(id, analysis)
    }
    
    // 进度回调
    if (onProgress) {
      onProgress(Math.min(i + concurrency, events.length), events.length)
    }
    
    // 避免 API 限流
    if (i + concurrency < events.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

/**
 * 健康度检查 - 分析时间分配
 */
export interface HealthReport {
  score: number
  issues: string[]
  suggestions: string[]
}

export function checkHealth(events: CalendarEvent[], days: number = 7): HealthReport {
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  // 统计各类别日程数量
  const categoryCount: Record<string, number> = {}
  let totalEvents = 0
  
  for (const event of events) {
    if (event.startTime >= startDate) {
      // 简单分类
      const title = event.title
      let category = 'other'
      
      if (title.includes('融资') || title.includes('投资') || title.includes('BP') || title.includes('FA')) category = 'fundraising'
      else if (title.includes('律师') || title.includes('股权') || title.includes('法律') || title.includes('架构')) category = 'legal'
      else if (title.includes('面试') || title.includes('招聘') || title.includes('offer') || title.includes('裁员')) category = 'hiring'
      else if (title.includes('客户') || title.includes('签约') || title.includes('销售') || title.includes('回款')) category = 'sales'
      else if (title.includes('产品') || title.includes('评审') || title.includes('路线图') || title.includes('技术债')) category = 'product'
      else if (title.includes('团队') || title.includes('例会') || title.includes('1:1') || title.includes('团建')) category = 'team'
      else if (title.includes('财务') || title.includes('税务') || title.includes('预算') || title.includes('现金流')) category = 'finance'
      else if (title.includes('学习') || title.includes('健身') || title.includes('教练')) category = 'personal'
      
      categoryCount[category] = (categoryCount[category] || 0) + 1
      totalEvents++
    }
  }
  
  const issues: string[] = []
  const suggestions: string[] = []
  
  // 检查时间分配
  if (totalEvents > 0) {
    const fundraisingRatio = (categoryCount['fundraising'] || 0) / totalEvents
    
    // 融资太多
    if (fundraisingRatio > 0.5) {
      issues.push('⚠️ 你最近50%以上的时间在处理融资相关事务')
      suggestions.push('💡 融资固然重要，但产品才是公司的根本。建议分配更多时间在产品开发上。')
    }
  }
  
  // 检查关键事项缺失
  if (!categoryCount['legal'] && totalEvents > 5) {
    issues.push('⚠️ 你最近没有法律/股权相关的会议')
    suggestions.push('💡 建议至少每月审阅一次合同和股权相关事务。')
  }
  
  if (!categoryCount['team'] && totalEvents > 3) {
    issues.push('⚠️ 你最近没有与团队的例会或1:1')
    suggestions.push('💡 建议每周至少与核心团队成员进行1:1沟通。')
  }
  
  if (!categoryCount['product'] && totalEvents > 3) {
    issues.push('⚠️ 你最近没有产品相关的会议')
    suggestions.push('💡 产品是公司的根本，建议至少每两周安排一次产品评审。')
  }
  
  // 财务检查
  if (!categoryCount['finance'] && totalEvents > 5) {
    issues.push('⚠️ 你最近没有与财务相关的会议')
    suggestions.push('💡 建议每月至少与财务深入沟通一次，关注现金流。')
  }
  
  // 个人成长检查
  if (!categoryCount['personal'] && totalEvents > 10) {
    issues.push('⚠️ 你最近没有安排个人成长/休息时间')
    suggestions.push('💡 创始人需要持续充电，建议每周安排至少2小时的学习/运动时间。')
  }
  
  const score = Math.max(0, 100 - issues.length * 20)
  
  return { score, issues, suggestions }
}
