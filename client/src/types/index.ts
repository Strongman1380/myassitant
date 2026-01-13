export type AssistantMode = 'text' | 'email' | 'calendar' | 'memory' | 'assistant';

export interface TextResponse {
  success: boolean;
  original: string;
  rewritten: string;
}

export interface EmailResponse {
  type: 'email';
  to: string;
  subject: string;
  body: string;
}

export interface CalendarResponse {
  type: 'calendar';
  title: string;
  notes: string | null;
  start: string; // ISO-8601
  end: string; // ISO-8601
  reminderMinutesBefore: number | null;
}

export interface MemoryListResponse {
  type: 'memory_dump';
  memories: string[];
}

export interface MemoryAddResponse {
  success: boolean;
  fact: string;
  totalMemories: number;
}

export interface AssistantResponse {
  success: boolean;
  message: string;
}
