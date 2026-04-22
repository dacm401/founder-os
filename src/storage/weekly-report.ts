/**
 * 周报生成模块
 * 每周日自动生成周报摘要，支持一键分享给投资人
 */

import { getRecentHistory, getTrendAnalysis } from './history'
import { generateFeedbackReport } from './feedback'
import { CalendarEvent, AnalysisResult } from '../types'

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  generatedAt: string
  
  // 数据概览
  overview: {
    totalEvents: number
    avgEventsPerDay: number
    totalHours: number
    weekendEvents: number
    eveningEvents: number
  }
  
  // 时间分配
  timeAllocation: {
    categories: Record<string, { count: number; hours: number; percentage: number }>
    pieChart: string  // ASCII 饼图
  }
  
  // 趋势分析
  trends: {
    vsLastWeek: {
      eventChange: number  // 百分比
      healthChange: number
      topGainer: string
      topLoser: string
    }
    narrative: string
  }
  
  // 健康度
  health: {
    avgScore: number
    recoveryDays: number
    issues: string[]
  }
  
  // 亮点 & 建议
  highlights: string[]
  suggestions: string[]
  
  // 一键分享格式
  investorSummary: string
}

/**
 * 生成 ASCII 饼图
 */
function generatePieChart(data: Record<string, number>): string {
  const categoryNames: Record<string, string> = {
    fundraising: '融资',
    legal: '法务',
    hiring: '招聘',
    sales: '销售',
    product: '产品',
    team: '团队',
    finance: '财务',
    personal: '个人',
    other: '其他'
  }
  
  const emojis: Record<string, string> = {
    fundraising: '💰',
    legal: '⚖️',
    hiring: '👥',
    sales: '💵',
    product: '🎯',
    team: '🤝',
    finance: '📊',
    personal: '🌿',
    other: '📌'
  }
  
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  if (total === 0) return '暂无数据'
  
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // 只显示前5类
  
  const lines: string[] = ['```']
  const barWidth = 20
  
  for (const [cat, count] of sorted) {
    const percentage = Math.round((count / total) * 100)
    const barLen = Math.round((percentage / 100) * barWidth)
    const bar = '█'.repeat(barLen) + '░'.repeat(barWidth - barLen)
    const emoji = emojis[cat] || '📌'
    const name = categoryNames[cat] || cat
    
    lines.push(`${emoji} ${name.padEnd(4)} ${bar} ${percentage.toString().padStart(3)}% (${count})`)
  }
  
  lines.push('```')
  return lines.join('\n')
}

/**
 * 生成趋势对比说明
 */
function generateTrendNarrative(
  thisWeekEvents: number,
  lastWeekEvents: number,
  thisWeekHealth: number,
  lastWeekHealth: number,
  categoryChanges: Record<string, number>
): string {
  const parts: string[] = []
  
  // 日程量变化
  if (thisWeekEvents > lastWeekEvents * 1.2) {
    const pct = Math.round((thisWeekEvents / lastWeekEvents - 1) * 100)
    parts.push(`本周日程量较上周增加 ${pct}%，节奏有所加快`)
  } else if (thisWeekEvents < lastWeekEvents * 0.8) {
    const pct = Math.round((1 - thisWeekEvents / lastWeekEvents) * 100)
    parts.push(`本周日程量较上周减少 ${pct}%，节奏有所放缓`)
  } else {
    parts.push('本周日程量与上周基本持平')
  }
  
  // 健康度变化
  if (thisWeekHealth > lastWeekHealth + 10) {
    parts.push('健康度明显提升')
  } else if (thisWeekHealth < lastWeekHealth - 10) {
    parts.push('健康度有所下降，需要注意休息')
  }
  
  // 最大的增长和下降
  const changes = Object.entries(categoryChanges)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => b[1] - a[1])
  
  if (changes.length > 0) {
    const [top] = changes
    if (top[1] > 0) {
      parts.push(`最多增加的是 ${top[0]} 类事务`)
    }
  }
  
  if (changes.length > 1) {
    const [, bottom] = changes
    if (bottom[1] < 0) {
      parts.push(`减少最多的是 ${bottom[0]} 类事务`)
    }
  }
  
  return parts.join('；') + '。'
}

/**
 * 生成亮点和建议
 */
function generateInsights(
  weekData: {
    totalEvents: number
    categoryCount: Record<string, number>
    eveningEvents: number
    weekendEvents: number
    personalEvents: number
  },
  trends: { thisWeek: any, lastWeek: any }
): { highlights: string[], suggestions: string[] } {
  const highlights: string[] = []
  const suggestions: string[] = []
  
  const total = weekData.totalEvents
  if (total === 0) {
    return { highlights: ['本周暂无日程记录'], suggestions: [] }
  }
  
  // 亮点检测
  if (weekData.personalEvents > 0) {
    highlights.push(`✅ 安排了 ${weekData.personalEvents} 项个人时间（运动、学习等）`)
  }
  
  if (weekData.eveningEvents === 0 && weekData.weekendEvents === 0) {
    highlights.push('✅ 本周没有深夜或周末加班日程')
  }
  
  // 类别分布亮点
  const cats = weekData.categoryCount
  if (cats.product && cats.product >= 3) {
    highlights.push(`✅ 产品评审安排了 ${cats.product} 次，保持产品聚焦`)
  }
  
  if (cats.hiring && cats.hiring >= 2) {
    highlights.push(`✅ 招聘面试安排了 ${cats.hiring} 次，团队建设持续推进`)
  }
  
  // 建议
  if (weekData.eveningEvents >= 3) {
    suggestions.push('💡 建议减少深夜日程，持续高压影响判断力')
  }
  
  if (weekData.weekendEvents >= 2) {
    suggestions.push('💡 建议减少周末加班，创始人需要充分休息')
  }
  
  if (!cats.product && total > 3) {
    suggestions.push('💡 下周建议安排 1-2 次产品相关会议，保持对产品方向的把控')
  }
  
  if (!cats.team && total > 3) {
    suggestions.push('💡 下周建议与核心团队成员进行 1:1 沟通')
  }
  
  if (!cats.personal) {
    suggestions.push('💡 建议下周安排一些个人时间（运动、学习、休息）')
  }
  
  // 融资检查（如果有融资相关日程，给予正面反馈）
  if (cats.fundraising && cats.fundraising >= 1) {
    suggestions.push('💼 融资进展值得关注，如有重大进展可及时同步')
  }
  
  return { highlights, suggestions }
}

/**
 * 生成投资人友好的摘要
 */
function generateInvestorSummary(report: Omit<WeeklyReport, 'investorSummary'>): string {
  const categoryNames: Record<string, string> = {
    fundraising: '融资',
    legal: '法务',
    hiring: '招聘',
    sales: '销售',
    product: '产品',
    team: '团队',
    finance: '财务',
    personal: '个人',
    other: '其他'
  }
  
  // 时间分配摘要
  const topCategories = Object.entries(report.timeAllocation.categories)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([cat, data]) => `${categoryNames[cat] || cat}(${data.count}次, ${Math.round(data.percentage)}%)`)
    .join('、')
  
  // 亮点摘要
  const highlightSummary = report.highlights
    .filter(h => h.startsWith('✅'))
    .map(h => h.substring(2))
    .join('；')
  
  let summary = `# ${report.weekStart} ~ ${report.weekEnd} 周报

## 📊 数据概览
- 日程总数：${report.overview.totalEvents} 项
- 日均日程：${report.overview.avgEventsPerDay.toFixed(1)} 项
- 工作时长：约 ${report.overview.totalHours} 小时

## ⏰ 时间分配
${report.timeAllocation.pieChart}

前三大事务类型：${topCategories || '暂无数据'}

## 📈 趋势变化
${report.trends.narrative}

## 🏥 健康度评分
${report.health.avgScore}/100
${report.health.recoveryDays >= 3 ? `⚠️ 连续 ${report.health.recoveryDays} 天高强度工作，建议安排休息` : '状态良好，继续保持'}

## ✨ 本周亮点
${highlightSummary || '继续努力'}

${report.suggestions.length > 0 ? '## 💡 建议\n' + report.suggestions.map(s => '- ' + s.substring(2)).join('\n') : ''}

---
*由 FounderOS 自动生成*
`
  
  return summary
}

/**
 * 生成周报
 */
export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const now = new Date()
  
  // 获取本周开始和结束
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  // 获取历史数据
  const history = await getRecentHistory(7)
  const trends = await getTrendAnalysis()
  const feedback = await generateFeedbackReport()
  
  // 合并本周所有日程
  const weekEvents: Array<{ event: CalendarEvent, analysis: AnalysisResult }> = []
  for (const record of history) {
    const recordDate = new Date(record.date)
    if (recordDate >= weekStart && recordDate <= weekEnd) {
      for (const event of record.events) {
        weekEvents.push({
          event: {
            id: event.eventId,
            title: event.title,
            startTime: new Date(event.startTime),
            endTime: new Date(event.startTime),
            duration: 60,
            attendees: [],
            isOnline: false
          },
          analysis: event.analysis as AnalysisResult
        })
      }
    }
  }
  
  // 如果没有数据，使用趋势数据中的统计
  const totalEvents = trends.thisWeek?.totalEvents || weekEvents.length
  const categoryCount: Record<string, number> = {}
  let totalHours = 0
  let eveningEvents = 0
  let weekendEvents = 0
  let personalEvents = 0
  
  // 从趋势数据获取类别统计
  if (trends.thisWeek?.categoryCount) {
    Object.assign(categoryCount, trends.thisWeek.categoryCount)
  }
  
  // 计算概览
  const avgEventsPerDay = totalEvents / 7
  
  // 计算各类别时长（估算）
  const categoryHours: Record<string, number> = {}
  const categoryNames: Record<string, string> = {
    fundraising: '融资', legal: '法务', hiring: '招聘', sales: '销售',
    product: '产品', team: '团队', finance: '财务', personal: '个人', other: '其他'
  }
  
  for (const [cat, count] of Object.entries(categoryCount)) {
    categoryHours[cat] = count * 1.0 // 假设每个日程平均1小时
    totalHours += categoryHours[cat]
  }
  
  // 生成饼图
  const pieChart = generatePieChart(categoryCount)
  
  // 计算时间分配详情
  const timeAllocation: Record<string, { count: number; hours: number; percentage: number }> = {}
  for (const [cat, count] of Object.entries(categoryCount)) {
    const hours = categoryHours[cat] || 0
    timeAllocation[cat] = {
      count,
      hours,
      percentage: totalHours > 0 ? (hours / totalHours) * 100 : 0
    }
  }
  
  // 趋势变化
  const thisWeekEvents = trends.thisWeek?.totalEvents || 0
  const lastWeekEvents = trends.lastWeek?.totalEvents || 0
  const thisWeekHealth = trends.thisWeek?.avgHealthScore || 70
  const lastWeekHealth = trends.lastWeek?.avgHealthScore || 70
  
  // 计算类别变化
  const categoryChanges: Record<string, number> = {}
  if (trends.thisWeek?.categoryCount && trends.lastWeek?.categoryCount) {
    for (const cat of new Set([...Object.keys(trends.thisWeek.categoryCount), ...Object.keys(trends.lastWeek.categoryCount)])) {
      const thisCount = trends.thisWeek.categoryCount[cat] || 0
      const lastCount = trends.lastWeek.categoryCount[cat] || 0
      categoryChanges[categoryNames[cat] || cat] = thisCount - lastCount
    }
  }
  
  const narrative = generateTrendNarrative(
    thisWeekEvents,
    lastWeekEvents,
    thisWeekHealth,
    lastWeekHealth,
    categoryChanges
  )
  
  // 亮点和建议
  const { highlights, suggestions } = generateInsights(
    { totalEvents, categoryCount, eveningEvents, weekendEvents, personalEvents },
    trends
  )
  
  // 构建报告
  const reportData: Omit<WeeklyReport, 'investorSummary'> = {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    generatedAt: now.toISOString(),
    overview: {
      totalEvents,
      avgEventsPerDay,
      totalHours,
      weekendEvents,
      eveningEvents
    },
    timeAllocation: {
      categories: timeAllocation,
      pieChart
    },
    trends: {
      vsLastWeek: {
        eventChange: lastWeekEvents > 0 ? Math.round((thisWeekEvents / lastWeekEvents - 1) * 100) : 0,
        healthChange: thisWeekHealth - lastWeekHealth,
        topGainer: Object.entries(categoryChanges).sort((a, b) => b[1] - a[1])[0]?.[0] || '',
        topLoser: Object.entries(categoryChanges).sort((a, b) => a[1] - b[1])[0]?.[0] || ''
      },
      narrative
    },
    health: {
      avgScore: thisWeekHealth,
      recoveryDays: 0, // 从健康报告获取
      issues: []
    },
    highlights,
    suggestions
  }
  
  // 生成投资人摘要
  const investorSummary = generateInvestorSummary(reportData)
  
  return {
    ...reportData,
    investorSummary
  }
}

/**
 * 获取周报（支持自定义时间段）
 */
export async function getWeeklyReport(
  weekStart?: string,
  weekEnd?: string
): Promise<WeeklyReport> {
  if (weekStart && weekEnd) {
    // 使用指定时间段
    const report = await generateWeeklyReport()
    report.weekStart = weekStart
    report.weekEnd = weekEnd
    return report
  }
  return generateWeeklyReport()
}
