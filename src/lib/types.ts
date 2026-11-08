export type RecurUnit = "day" | "week" | "month" | "year";
export type ProjectStatus = "green" | "amber" | "red";

export type Area = {
  id: string;
  code: string;
  name: string;
  sort: number;
};

export type ItemType = {
  id: string;
  name: string;
  lead_days: number;
  sort: number;
};

export type Item = {
  id: string;
  area_id: string;
  type_id: string | null;
  project_id: string | null;
  module_id?: string | null;
  parent_id: string | null;
  ipa_candidate_id?: string | null;
  title: string;
  due_date: string;
  /** Echte Frist bei kritischen Terminen; due_date liegt dann CRITICAL_BUFFER_DAYS davor */
  deadline?: string | null;
  /** Auf die Heute-Liste gesetzt fuer diesen Tag */
  planned_for?: string | null;
  lead_days: number | null;
  note: string | null;
  recur_every: number | null;
  recur_unit: RecurUnit | null;
  done_at: string | null;
  /** Gesetzt bei Terminen aus Outlook (nur lesend) */
  event?: { time: string | null; webLink: string | null; /** nicht im Zeitstrahl, z.B. Lektionen */ quiet?: boolean };
};

export type Project = {
  id: string;
  area_id: string;
  title: string;
  status: ProjectStatus;
  next_step: string | null;
  next_milestone: string | null;
  archived_at: string | null;
};

export type Absence = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
};

export type IpaCandidate = {
  id: string;
  code: string;
  start_date: string;
  end_date: string;
  presentation_date: string | null;
  profession: "informatiker" | "ict";
};

export type Referee = {
  id: string;
  name: string;
  kind: "verein" | "mini";
  active: boolean;
};

export type RefereeQuota = {
  id: string;
  referee_id: string;
  year: number;
  status: "open" | "on_track" | "paused" | "reached";
  note: string | null;
  newcomer: boolean;
};

export type CalendarCategory = {
  id: string;
  category: string;
  area_id: string | null;
  lead_days: number;
  hidden: boolean;
  in_timeline?: boolean;
};

export type StudyModule = {
  id: string;
  name: string;
  semester: string | null;
  sort: number;
};
