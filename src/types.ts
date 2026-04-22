// Calendar Event Types

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  duration: number // in minutes
  attendees: Attendee[]
  location?: string
  isOnline: boolean
  meetingUrl?: string
}

export interface Attendee {
  id: string
  name: string
  email?: string
  isOrganizer: boolean
}

export interface AnalysisResult {
  importance: number // 0-100
  category: string // 'fundraising', 'hiring', 'sales', 'product', 'legal', 'team', 'other'
  briefTip: string // 1-2 sentences
  detailedExplanation: string // 200-300 characters
  encouragement: string // motivational message
}

export interface UserFeedback {
  eventId: string
  useful: boolean
  comment?: string
  timestamp: Date
}

export interface WeeklyStats {
  weekStart: string
  weekEnd: string
  categoryCount: Record<string, number>
  categoryTime: Record<string, number>
  avgHealthScore: number
  totalEvents: number
}

export interface StoredData {
  events: CalendarEvent[]
  analyses: Map<string, AnalysisResult>
  feedback: UserFeedback[]
}
