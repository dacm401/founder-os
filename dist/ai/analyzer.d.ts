import { CalendarEvent, AnalysisResult } from '../types';
/**
 * 分析单个日程
 */
export declare function analyzeEvent(event: CalendarEvent, knowledgeBase?: string): Promise<AnalysisResult>;
/**
 * 分析多个日程
 */
export declare function analyzeCalendar(events: CalendarEvent[], knowledgeBase?: string): Promise<Map<string, AnalysisResult>>;
/**
 * 健康度检查 - 分析时间分配
 */
export interface HealthReport {
    score: number;
    issues: string[];
    suggestions: string[];
}
export declare function checkHealth(events: CalendarEvent[], days?: number): HealthReport;
