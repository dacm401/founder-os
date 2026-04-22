/**
 * FounderOS - 创始人日程智能助手
 * 完整功能：读取飞书日历 -> AI分析 -> 飞书推送
 */

import { CalendarEvent, AnalysisResult } from './types.js'
import { analyzeCalendar, checkHealth } from './ai/analyzer.js'
import { sendStarredEventsNotification, sendHealthCheckReminder } from './notifier/feishu.js'

// 飞书日历 ID
const FEISHU_CALENDAR_ID = 'feishu.cn_CWNI6VtVtwHeLBp3qRIAof@group.calendar.feishu.cn'

function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const categoryEmoji: Record<string, string> = {
  fundraising: '💰',
  hiring: '👥',
  sales: '🤝',
  product: '📦',
  legal: '⚖️',
  team: '👨‍👩‍👧‍👦',
  other: '📅'
}

/**
 * 主函数 - 会被 cron 调用
 */
export async function runFounderOS(userOpenId: string): Promise<string> {
  console.log('\n🦞 FounderOS 启动...\n')
  
  // 1. 读取飞书日历
  console.log('📅 读取飞书日历...')
  const events = await fetchFeishuCalendar()
  console.log(`✅ 读取到 ${events.length} 个日程\n`)
  
  if (events.length === 0) {
    return '📭 今天日历是空的，没有需要分析的日程。'
  }
  
  // 2. AI 分析
  console.log('🤖 AI 分析中...')
  const analyses = await analyzeCalendar(events)
  
  // 3. 筛选重要日程
  const starredEvents: Array<{event: CalendarEvent, analysis: AnalysisResult}> = events
    .map((event) => ({
      event,
      analysis: analyses.get(event.id)!
    }))
    .filter((item) => item.analysis && item.analysis.importance >= 70)
    .sort((a, b) => b.analysis.importance - a.analysis.importance)
  
  // 4. 健康度检查
  const health = await checkHealth(events, 7)
  
  // 5. 生成消息
  let message = ''
  
  if (starredEvents.length > 0) {
    message += `⭐ *今日重要日程* (${starredEvents.length}个)\n\n`
    
    for (const { event, analysis } of starredEvents) {
      const emoji = categoryEmoji[analysis.category] || '📅'
      const dateStr = formatDate(event.startTime)
      
      message += `${emoji} *${dateStr}* - ${event.title}\n`
      message += `   重要性: ${analysis.importance}/100 | ${analysis.category}\n`
      message += `   💡 ${analysis.briefTip}\n`
      message += `   💪 ${analysis.encouragement}\n\n`
    }
  } else {
    message += '🎉 今天没有需要特别关注的重要日程！\n\n'
  }
  
  // 健康度
  if (health.issues.length > 0) {
    message += '---\n\n'
    message += `🏥 *健康度: ${health.score}/100*\n\n`
    
    for (const issue of health.issues) {
      message += `${issue}\n`
    }
    message += '\n'
    
    for (const suggestion of health.suggestions) {
      message += `${suggestion}\n`
    }
  }
  
  message += '\n_使用 /founder 查看完整分析_'
  
  console.log('📱 消息生成完成\n')
  
  return message
}

/**
 * 读取飞书日历
 * 这个函数会被 OpenClaw 的飞书 API 调用
 */
async function fetchFeishuCalendar(): Promise<CalendarEvent[]> {
  // 这里需要从外部传入飞书事件数据
  // 在实际运行时由 OpenClaw 调用
  
  // 返回空数组，由外部填充
  return []
}

/**
 * 解析飞书日历事件
 */
export function parseFeishuEvent(feishuEvent: any): CalendarEvent {
  const startTime = new Date(parseInt(feishuEvent.start_time) * 1000)
  const endTime = new Date(parseInt(feishuEvent.end_time) * 1000)
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
  
  return {
    id: feishuEvent.event_id,
    title: feishuEvent.summary || '无标题',
    description: feishuEvent.description,
    startTime,
    endTime,
    duration,
    attendees: [],
    location: feishuEvent.location,
    isOnline: !!feishuEvent.vchat?.vc_type,
    meetingUrl: feishuEvent.vchat?.meeting_url
  }
}

// 导出主函数供外部调用
export { FEISHU_CALENDAR_ID }
