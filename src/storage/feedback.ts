/**
 * 用户反馈模块
 * 记录用户对分析结果的评价，用于个性化学习
 */

import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.env.HOME || '/tmp', '.founder-os', 'data')
const FEEDBACK_FILE = 'user-feedback.json'

export interface UserFeedback {
  id: string
  eventId: string
  eventTitle: string
  rating: 'helpful' | 'not_helpful' | 'skip'
  comment?: string
  timestamp: string
  // 用户后续行为
  eventOutcome?: 'completed' | 'cancelled' | 'rescheduled' | 'unknown'
}

interface FeedbackData {
  feedbacks: UserFeedback[]
  // 用户偏好学习
  userPreferences: {
    highValueCategories: string[]   // 用户认为重要的类别
    lowValueCategories: string[]    // 用户认为不重要的类别
    ignoredPatterns: string[]      // 用户经常忽略的日程模式
    lastUpdated: string
  }
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
 * 加载反馈数据
 */
export async function loadFeedbackData(): Promise<FeedbackData> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, FEEDBACK_FILE)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    return {
      feedbacks: [],
      userPreferences: {
        highValueCategories: [],
        lowValueCategories: [],
        ignoredPatterns: [],
        lastUpdated: new Date().toISOString()
      }
    }
  }
}

/**
 * 保存反馈数据
 */
export async function saveFeedbackData(data: FeedbackData): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, FEEDBACK_FILE)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * 记录用户反馈
 */
export async function recordFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<void> {
  const data = await loadFeedbackData()
  
  const newFeedback: UserFeedback = {
    ...feedback,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  }
  
  data.feedbacks.push(newFeedback)
  
  // 只保留最近 100 条反馈
  if (data.feedbacks.length > 100) {
    data.feedbacks = data.feedbacks.slice(-100)
  }
  
  // 更新用户偏好
  updateUserPreferences(data, feedback)
  
  await saveFeedbackData(data)
}

/**
 * 更新用户偏好（简单学习逻辑）
 */
function updateUserPreferences(data: FeedbackData, feedback: Omit<UserFeedback, 'id' | 'timestamp'>): void {
  const prefs = data.userPreferences
  prefs.lastUpdated = new Date().toISOString()
  
  if (feedback.rating === 'not_helpful' || feedback.rating === 'skip') {
    // 用户不认可这个分析，学习其模式
    const category = feedback.eventTitle
    
    // 提取关键词作为模式
    const patterns = extractPatterns(feedback.eventTitle)
    
    for (const pattern of patterns) {
      if (!prefs.ignoredPatterns.includes(pattern)) {
        prefs.ignoredPatterns.push(pattern)
      }
    }
    
    // 限制模式数量
    if (prefs.ignoredPatterns.length > 20) {
      prefs.ignoredPatterns = prefs.ignoredPatterns.slice(-20)
    }
  }
  
  if (feedback.rating === 'helpful') {
    // 用户认为有帮助，强化正面模式
    // 可以根据 eventOutcome 进一步学习
  }
}

/**
 * 从标题中提取模式
 */
function extractPatterns(title: string): string[] {
  const patterns: string[] = []
  const cleanTitle = title.toLowerCase()
  
  // 短于4个字的词不计入
  const words = cleanTitle.split(/[\s\-_]+/).filter(w => w.length >= 2)
  
  // 取前3个有意义的词
  const skipWords = ['的', '和', '与', '了', '在', '是', 'a', 'an', 'the', 'to', 'for']
  const meaningful = words.filter(w => !skipWords.includes(w)).slice(0, 3)
  
  return meaningful
}

/**
 * 获取用户偏好（用于调整分析）
 */
export async function getUserPreferences(): Promise<{
  ignoredPatterns: string[]
  highValueCategories: string[]
}> {
  const data = await loadFeedbackData()
  return {
    ignoredPatterns: data.userPreferences.ignoredPatterns,
    highValueCategories: data.userPreferences.highValueCategories
  }
}

/**
 * 检查日程是否匹配用户的忽略模式
 */
export async function matchesIgnoredPattern(title: string): Promise<boolean> {
  const { ignoredPatterns } = await getUserPreferences()
  const lowerTitle = title.toLowerCase()
  
  for (const pattern of ignoredPatterns) {
    if (lowerTitle.includes(pattern.toLowerCase())) {
      return true
    }
  }
  
  return false
}

/**
 * 获取需要跟进的日程（用户标记 helpful 但还没完成的）
 */
export async function getPendingFollowUps(): Promise<UserFeedback[]> {
  const data = await loadFeedbackData()
  
  return data.feedbacks
    .filter(f => f.rating === 'helpful' && f.eventOutcome === 'unknown')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * 生成反馈报告（用于周报）
 */
export async function generateFeedbackReport(): Promise<{
  totalFeedbacks: number
  helpfulRate: number
  topIgnoredPatterns: string[]
  weekSummary: string
}> {
  const data = await loadFeedbackData()
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const weekFeedbacks = data.feedbacks.filter(
    f => new Date(f.timestamp) >= oneWeekAgo
  )
  
  const helpfulCount = weekFeedbacks.filter(f => f.rating === 'helpful').length
  const helpfulRate = weekFeedbacks.length > 0 
    ? Math.round((helpfulCount / weekFeedbacks.length) * 100)
    : 0
  
  // 统计被忽略的模式
  const patternCounts: Record<string, number> = {}
  for (const f of data.feedbacks.filter(f => f.rating === 'skip' || f.rating === 'not_helpful')) {
    for (const pattern of extractPatterns(f.eventTitle)) {
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1
    }
  }
  
  const topIgnoredPatterns = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern]) => pattern)
  
  let weekSummary = ''
  if (weekFeedbacks.length === 0) {
    weekSummary = '本周暂无反馈数据'
  } else {
    weekSummary = `本周收到 ${weekFeedbacks.length} 条反馈，帮助率 ${helpfulRate}%`
  }
  
  return {
    totalFeedbacks: data.feedbacks.length,
    helpfulRate,
    topIgnoredPatterns,
    weekSummary
  }
}
