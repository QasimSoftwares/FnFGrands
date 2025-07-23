export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  settings?: Record<string, any>;
}

export interface OrganizationInsert {
  name: string;
  created_by: string;
  settings?: Record<string, any>;
}

export interface OrganizationUpdate {
  name?: string;
  updated_at?: string;
  settings?: Record<string, any>;
}
