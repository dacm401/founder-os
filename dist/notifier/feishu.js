const categoryEmoji = {
    fundraising: '💰',
    hiring: '👥',
    sales: '🤝',
    product: '📦',
    legal: '⚖️',
    team: '👨‍👩‍👧‍👦',
    other: '📅'
};
function formatDate(date) {
    return date.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
/**
 * 发送星标日程提醒到飞书
 * 这个函数会被 OpenClaw 调用
 */
export async function sendStarredEventsNotification(userId, events) {
    // 只取前5个最重要的
    const topEvents = events.slice(0, 5);
    if (topEvents.length === 0) {
        return '🎉 本周没有需要特别关注的重要日程！';
    }
    // 构建消息内容
    let message = `⭐ *本周重要日程提醒* (${topEvents.length}个)\n\n`;
    for (const { event, analysis } of topEvents) {
        const emoji = categoryEmoji[analysis.category] || '📅';
        const dateStr = formatDate(event.startTime);
        message += `${emoji} *${dateStr}* - ${event.title}\n`;
        message += `   重要性: ${analysis.importance}/100 | 类别: ${analysis.category}\n`;
        message += `   💡 ${analysis.briefTip}\n\n`;
        message += `   💪 ${analysis.encouragement}\n\n`;
        message += `---\n\n`;
    }
    message += `_使用 /founder 查看详情或调整设置_`;
    return message;
}
/**
 * 发送每日健康度检查提醒
 */
export async function sendHealthCheckReminder(userId, healthReport) {
    return `📊 *创始人健康度提醒*\n\n${healthReport}\n\n_记得关注你的时间分配哦_`;
}
// Placeholder for real Feishu integration
export async function sendViaFeishuBot(webhookUrl, content) {
    console.log('[模拟] 飞书机器人消息已发送');
    return true;
}
