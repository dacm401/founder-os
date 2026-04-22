import { CalendarEvent, AnalysisResult } from '../types';
/**
 * 分析单个日程 - 智能版本
 */
export declare function analyzeEvent(event: CalendarEvent): Promise<AnalysisResult & {
    stressLevel: string;
    requiresFollowUp: boolean;
}>;
export { CalendarEvent, AnalysisResult } from '../types';
export type { WeeklyStats } from '../types';
/**
 * 批量分析日程 - 带并发控制
 */
export declare function analyzeCalendar(events: CalendarEvent[], onProgress?: (completed: number, total: number) => void): Promise<Map<string, AnalysisResult & {
    stressLevel: string;
    requiresFollowUp: boolean;
}>>;
/**
 * 健康度检查 - 增强版 2.0
 */
export interface HealthReport {
    score: number;
    issues: string[];
    suggestions: string[];
    trends: string[];
    recoveryDays: number;
}
export declare function checkHealth(events: CalendarEvent[], days?: number): Promise<HealthReport>;
