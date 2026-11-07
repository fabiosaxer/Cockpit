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
  parent_id: string | null;
  title: string;
  due_date: string;
  lead_days: number | null;
  note: string | null;
  recur_every: number | null;
  recur_unit: RecurUnit | null;
  done_at: string | null;
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
