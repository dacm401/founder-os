import { CalendarEvent } from '../types';
interface FeishuEvent {
    event_id: string;
    summary: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    vchat?: {
        meeting_url?: string;
        vc_type?: string;
    };
    attendee_ability?: string;
    status?: string;
    visibility?: string;
}
/**
 * 设置从飞书导入的日程
 */
export declare function setImportedEvents(events: CalendarEvent[]): void;
/**
 * 获取已导入的飞书日程
 */
export declare function getImportedEvents(): CalendarEvent[];
export declare function generateMockCalendarEvents(): CalendarEvent[];
/**
 * 同步日历 - 优先使用飞书数据，如果没有则用模拟数据
 * 注意：这个函数需要从外部传入飞书事件数据
 */
export declare function syncCalendar(feishuEvents?: FeishuEvent[]): Promise<CalendarEvent[]>;
export {};
