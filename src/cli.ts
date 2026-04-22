/**
 * FounderOS CLI 入口
 * 使用方法: 
 *   node dist/cli.js              # 日常分析
 *   node dist/cli.js report       # 生成周报
 *   node dist/cli.js health       # 健康度检查
 */

import { analyzeCalendar, checkHealth } from './ai/analyzer.js'
import { CalendarEvent } from './types.js'
import { generateWeeklyReport } from './storage/weekly-report.js'

// 模拟命令行参数
const args = process.argv.slice(2)
const command = args[0] || 'analyze'

async function main() {
  console.log('\n🦞 FounderOS - 创始人日程智能助手\n')
  
  switch (command) {
    case 'report':
      await showWeeklyReport()
      break
    case 'health':
      await showHealth()
      break
    default:
      await analyze()
  }
}

async function analyze() {
  // 读取环境变量
  const calendarId = process.env.FEISHU_CALENDAR_ID
  const userOpenId = process.env.USER_OPEN_ID
  
  if (!calendarId) {
    console.log('❌ 请配置 FEISHU_CALENDAR_ID 环境变量')
    console.log('💡 复制 .env.example 为 .env 并填写配置\n')
    return
  }
  
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
  const health = await checkHealth(mockEvents)
  console.log(`🏥 健康度: ${health.score}/100`)
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ 配置完成！')
  console.log('='.repeat(50))
  console.log('\n下一步：')
  console.log('1. 在 .env 中配置飞书应用信息')
  console.log('2. 运行 npm run dev 开始使用')
  console.log('3. 每天 8 点会自动收到日程提醒\n')
}

async function showWeeklyReport() {
  console.log('📊 生成周报...\n')
  
  try {
    const report = await generateWeeklyReport()
    
    console.log('='.repeat(50))
    console.log(`📅 周报：${report.weekStart} ~ ${report.weekEnd}`)
    console.log('='.repeat(50))
    
    console.log('\n📊 数据概览')
    console.log(`  日程总数：${report.overview.totalEvents} 项`)
    console.log(`  日均日程：${report.overview.avgEventsPerDay.toFixed(1)} 项`)
    console.log(`  工作时长：约 ${report.overview.totalHours} 小时`)
    
    console.log('\n⏰ 时间分配')
    console.log(report.timeAllocation.pieChart)
    
    console.log('\n📈 趋势变化')
    console.log(`  ${report.trends.narrative}`)
    
    console.log('\n🏥 健康度')
    console.log(`  ${report.health.avgScore}/100`)
    if (report.health.recoveryDays >= 3) {
      console.log(`  ⚠️ 连续 ${report.health.recoveryDays} 天高强度工作`)
    }
    
    if (report.highlights.length > 0) {
      console.log('\n✨ 本周亮点')
      for (const h of report.highlights) {
        console.log(`  ${h}`)
      }
    }
    
    if (report.suggestions.length > 0) {
      console.log('\n💡 建议')
      for (const s of report.suggestions) {
        console.log(`  ${s}`)
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📋 投资人摘要（可一键分享）')
    console.log('='.repeat(50))
    console.log(report.investorSummary)
    
  } catch (error) {
    console.error('生成周报失败:', error)
  }
}

async function showHealth() {
  console.log('🏥 健康度检查\n')
  
  // 模拟日程数据
  const mockEvents: CalendarEvent[] = [
    { id: '1', title: '团队周例会', startTime: new Date(), endTime: new Date(), duration: 60, attendees: [], isOnline: true },
    { id: '2', title: '产品评审', startTime: new Date(), endTime: new Date(), duration: 90, attendees: [], isOnline: true },
  ]
  
  const health = await checkHealth(mockEvents)
  
  console.log(`🏥 健康度评分: ${health.score}/100\n`)
  
  if (health.issues.length > 0) {
    console.log('⚠️ 发现问题:')
    for (const issue of health.issues) {
      console.log(`  ${issue}`)
    }
    console.log('')
  }
  
  if (health.suggestions.length > 0) {
    console.log('💡 建议:')
    for (const suggestion of health.suggestions) {
      console.log(`  ${suggestion}`)
    }
  }
  
  if (health.trends.length > 0) {
    console.log('')
    for (const trend of health.trends) {
      console.log(`  ${trend}`)
    }
  }
}

main().catch(console.error)
