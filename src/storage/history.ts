/**
 * 历史数据存储
 * 负责持久化日程分析结果，支持趋势对比
 */

import fs from 'fs/promises'
import path from 'path'
import { CalendarEvent, AnalysisResult, WeeklyStats } from '../types'

const DATA_DIR = path.join(process.env.HOME || '/tmp', '.founder-os', 'data')
const HISTORY_FILE = 'analysis-history.json'

export interface HistoryRecord {
  date: string // YYYY-MM-DD
  events: {
    eventId: string
    title: string
    startTime: string
    analysis: AnalysisResult
  }[]
  healthScore: number
  summary: string
}

interface HistoryData {
  records: HistoryRecord[]
  weeklyStats: WeeklyStats[]
}

/**
 * 确保数据目录存在
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (e) {
    // 目录已存在
  }
}

/**
 * 加载历史数据
 */
export async function loadHistory(): Promise<HistoryData> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, HISTORY_FILE)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    return { records: [], weeklyStats: [] }
  }
}

/**
 * 保存历史数据
 */
export async function saveHistory(data: HistoryData): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, HISTORY_FILE)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * 记录一天的分析结果
 */
export async function recordDay(
  events: CalendarEvent[],
  analyses: Map<string, AnalysisResult>,
  healthScore: number,
  summary: string
): Promise<void> {
  const data = await loadHistory()
  const today = new Date().toISOString().split('T')[0]
  
  // 检查是否已存在今天的记录
  const existingIndex = data.records.findIndex(r => r.date === today)
  
  const record: HistoryRecord = {
    date: today,
    events: events.map(event => ({
      eventId: event.id,
      title: event.title,
      startTime: event.startTime.toISOString(),
      analysis: analyses.get(event.id) || {
        importance: 50,
        category: 'other',
        briefTip: '',
        detailedExplanation: '',
        encouragement: ''
      }
    })),
    healthScore,
    summary
  }
  
  if (existingIndex >= 0) {
    data.records[existingIndex] = record
  } else {
    data.records.push(record)
  }
  
  // 只保留最近 90 天的数据
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  data.records = data.records.filter(r => new Date(r.date) >= cutoff)
  
  // 更新周统计
  updateWeeklyStats(data)
  
  await saveHistory(data)
}

/**
 * 更新周统计
 */
function updateWeeklyStats(data: HistoryData): void {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // 周一
  weekStart.setHours(0, 0, 0, 0)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  // 获取本周记录
  const weekRecords = data.records.filter(r => {
    const d = new Date(r.date)
    return d >= weekStart && d <= weekEnd
  })
  
  // 统计各类别
  const categoryCount: Record<string, number> = {}
  const categoryTime: Record<string, number> = {}
  
  for (const record of weekRecords) {
    for (const event of record.events) {
      const cat = event.analysis.category
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
      // 粗略估算时长（实际应该从日程获取）
      categoryTime[cat] = (categoryTime[cat] || 0) + 60 
    }
  }
  
  const weekStats: WeeklyStats = {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    categoryCount,
    categoryTime,
    avgHealthScore: weekRecords.length > 0 
      ? Math.round(weekRecords.reduce((sum, r) => sum + r.healthScore, 0) / weekRecords.length)
      : 0,
    totalEvents: weekRecords.reduce((sum, r) => sum + r.events.length, 0)
  }
  
  // 更新或添加本周统计
  const existingWeekIndex = data.weeklyStats.findIndex(
    w => w.weekStart === weekStats.weekStart
  )
  
  if (existingWeekIndex >= 0) {
    data.weeklyStats[existingWeekIndex] = weekStats
  } else {
    data.weeklyStats.push(weekStats)
  }
  
  // 只保留最近 12 周的周统计
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  data.weeklyStats = data.weeklyStats.filter(w => new Date(w.weekStart) >= twelveWeeksAgo)
}

/**
 * 获取最近 N 天的历史记录
 */
export async function getRecentHistory(days: number = 7): Promise<HistoryRecord[]> {
  const data = await loadHistory()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  return data.records
    .filter(r => new Date(r.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/**
 * 获取趋势分析
 */
export async function getTrendAnalysis(): Promise<{
  thisWeek: WeeklyStats | null
  lastWeek: WeeklyStats | null
  trends: Record<string, 'up' | 'down' | 'stable'>
}> {
  const data = await loadHistory()
  
  const thisWeek = data.weeklyStats[data.weeklyStats.length - 1] || null
  const lastWeek = data.weeklyStats[data.weeklyStats.length - 2] || null
  
  const trends: Record<string, 'up' | 'down' | 'stable'> = {}
  
  if (thisWeek && lastWeek) {
    for (const cat of [...new Set([...Object.keys(thisWeek.categoryCount), ...Object.keys(lastWeek.categoryCount)])]) {
      const thisCount = thisWeek.categoryCount[cat] || 0
      const lastCount = lastWeek.categoryCount[cat] || 0
      const diff = thisCount - lastCount
      
      if (diff > 1) trends[cat] = 'up'
      else if (diff < -1) trends[cat] = 'down'
      else trends[cat] = 'stable'
    }
  }
  
  return { thisWeek, lastWeek, trends }
}

/**
 * 生成趋势提醒
 */
export async function generateTrendTips(): Promise<string[]> {
  const tips: string[] = []
  const trends = await getTrendAnalysis()
  
  if (!trends.thisWeek || !trends.lastWeek) {
    return tips
  }
  
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
  
  for (const [cat, trend] of Object.entries(trends.trends)) {
    const catName = categoryNames[cat] || cat
    const thisCount = trends.thisWeek.categoryCount[cat] || 0
    const lastCount = trends.lastWeek.categoryCount[cat] || 0
    
    if (trend === 'up' && thisCount > lastCount) {
      tips.push(`📈 ${catName}事务增加了 ${thisCount - lastCount} 项`)
    } else if (trend === 'down' && thisCount < lastCount) {
      tips.push(`📉 ${catName}事务减少了 ${lastCount - thisCount} 项`)
    }
  }
  
  // 健康度趋势
  const healthDiff = trends.thisWeek.avgHealthScore - trends.lastWeek.avgHealthScore
  if (healthDiff > 10) {
    tips.push('💪 健康度明显提升！')
  } else if (healthDiff < -10) {
    tips.push('⚠️ 健康度有所下降，注意休息')
  }
  
  return tips
}
