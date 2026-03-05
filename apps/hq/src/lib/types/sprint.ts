// Matches the existing Supabase schema from the Lovable Sprint HQ

export interface Sprint {
  id: string;
  slug: string;
  title: string;
  start_date: string; // ISO date
  timezone: string;
  session_time: string; // e.g., "13:00"
  status: "draft" | "published" | "archived";
  template_id: string | null;
  zoom_url_day1: string | null;
  zoom_url_day2: string | null;
  zoom_url_day3: string | null;
  calendar_url: string | null;
  community_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SprintTemplate {
  id: string;
  name: string;
  is_active: boolean;
  schedule_config: ScheduleDay[];
  project_kit_url: string | null;
  submit_work_url: string | null;
  submit_work_embed_url: string | null;
  booking_url_day4: string | null;
  claude_signup_url: string | null;
  setup_companion_video_url: string | null;
  daily_workflow_video_url: string | null;
  conversation_starters_video_url: string | null;
  conversation_starter_day1_url: string | null;
  conversation_starter_day2_url: string | null;
  conversation_starter_day3_url: string | null;
  created_at: string;
  updated_at: string;
}

// Public mirror of template (what participants see)
export type SprintTemplatePublic = SprintTemplate;

export interface ScheduleDay {
  day: number;
  topic: string;
  duration: string;
  dayOfWeek: string;
  hasSession: boolean;
}

export interface SprintDailyRecap {
  id: string;
  sprint_id: string;
  day_number: number;
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  recording_url: string | null;
  recap_summary: string | null;
  key_takeaways: string | null;
  resources: RecapResource[] | null;
  created_at: string;
  updated_at: string;
}

export interface RecapResource {
  id: string;
  name: string;
  url: string;
  type: "link" | "file";
}

// Phase engine types
export type SprintPhase = "pre-sprint" | "active" | "buffer" | "post-sprint";

export interface PhaseInfo {
  phase: SprintPhase;
  activeDay: number | null; // 1-4 during active phase, null otherwise
  currentDayIndex: number; // 0-based index into schedule
}

// Generated schedule with actual dates
export interface ScheduleDayWithDate extends ScheduleDay {
  date: string; // formatted date string e.g., "March 2"
  isoDate: string; // ISO date for comparisons
}
