/**
 * FounderOS CLI 入口
 * 使用方法: node dist/cli.js
 */

import { analyzeCalendar, checkHealth } from './ai/analyzer.js'
import { CalendarEvent } from './types.js'

// 模拟命令行参数
const args = process.argv.slice(2)

async function main() {
  console.log('\n🦞 FounderOS - 创始人日程智能助手\n')
  
  // 读取环境变量
  const calendarId = process.env.FEISHU_CALENDAR_ID
  const userOpenId = process.env.USER_OPEN_ID
  
  if (!calendarId) {
    console.log('❌ 请配置 FEISHU_CALENDAR_ID 环境变量')
    console.log('💡 复制 .env.example 为 .env 并填写配置\n')
    return
  }
  
  // 这里需要调用飞书 API 获取日程
  // 实际使用时需要飞书应用权限
  console.log('📅 请在飞书日历中添加日程')
  console.log('💡 FounderOS 会每天自动分析并发送提醒\n')
  
  // 示例：使用模拟数据演示功能
  console.log('📊 功能演示（模拟数据）：\n')
  
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: '与投资人王总聊A轮融资',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      duration: 60,
      attendees: [],
      isOnline: true
    },
    {
      id: '2',
      title: '产品路线图评审',
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 90000000),
      duration: 60,
      attendees: [],
      isOnline: true
    },
    {
      id: '3',
      title: '团队周例会',
      startTime: new Date(Date.now() + 172800000),
      endTime: new Date(Date.now() + 180000000),
      duration: 60,
      attendees: [],
      isOnline: false
    }
  ]
  
  // 分析
  const analyses = await analyzeCalendar(mockEvents)
  
  // 显示结果
  console.log('⭐ 重要日程：\n')
  
  for (const event of mockEvents) {
    const analysis = analyses.get(event.id)
    if (analysis && analysis.importance >= 70) {
      console.log(`  ${analysis.category}: ${event.title}`)
      console.log(`    重要性: ${analysis.importance}/100`)
      console.log(`    💡 ${analysis.briefTip}\n`)
    }
  }
  
  // 健康度
  const health = checkHealth(mockEvents)
  console.log(`🏥 健康度: ${health.score}/100`)
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ 配置完成！')
  console.log('='.repeat(50))
  console.log('\n下一步：')
  console.log('1. 在 .env 中配置飞书应用信息')
  console.log('2. 运行 npm run dev 开始使用')
  console.log('3. 每天 8 点会自动收到日程提醒\n')
}

main().catch(console.error)
