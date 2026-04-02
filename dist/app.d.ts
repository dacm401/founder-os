/**
 * FounderOS - 创始人日程智能助手
 * 完整功能：读取飞书日历 -> AI分析 -> 飞书推送
 */
import { CalendarEvent } from './types.js';
declare const FEISHU_CALENDAR_ID = "feishu.cn_CWNI6VtVtwHeLBp3qRIAof@group.calendar.feishu.cn";
/**
 * 主函数 - 会被 cron 调用
 */
export declare function runFounderOS(userOpenId: string): Promise<string>;
/**
 * 解析飞书日历事件
 */
export declare function parseFeishuEvent(feishuEvent: any): CalendarEvent;
export { FEISHU_CALENDAR_ID };
