export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    attendees: Attendee[];
    location?: string;
    isOnline: boolean;
    meetingUrl?: string;
}
export interface Attendee {
    id: string;
    name: string;
    email?: string;
    isOrganizer: boolean;
}
export interface AnalysisResult {
    importance: number;
    category: string;
    briefTip: string;
    detailedExplanation: string;
    encouragement: string;
}
export interface UserFeedback {
    eventId: string;
    useful: boolean;
    comment?: string;
    timestamp: Date;
}
export interface StoredData {
    events: CalendarEvent[];
    analyses: Map<string, AnalysisResult>;
    feedback: UserFeedback[];
}
