import { CalendarEvent, AnalysisResult } from '../types';
export interface FeishuConfig {
    webhookUrl?: string;
    botId?: string;
}
/**
 * 发送星标日程提醒到飞书
 * 这个函数会被 OpenClaw 调用
 */
export declare function sendStarredEventsNotification(userId: string, events: Array<{
    event: CalendarEvent;
    analysis: AnalysisResult;
}>): Promise<string>;
/**
 * 发送每日健康度检查提醒
 */
export declare function sendHealthCheckReminder(userId: string, healthReport: string): Promise<string>;
export declare function sendViaFeishuBot(webhookUrl: string, content: string): Promise<boolean>;
