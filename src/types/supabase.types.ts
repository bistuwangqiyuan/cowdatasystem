/**
 * Supabase Database Types
 * 
 * 自动生成的数据库类型定义，映射Supabase PostgreSQL模式。
 * 
 * @module types/supabase.types
 */

/**
 * 数据库模式定义
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      cows: {
        Row: CowRow;
        Insert: CowInsert;
        Update: CowUpdate;
      };
      health_records: {
        Row: HealthRecordRow;
        Insert: HealthRecordInsert;
        Update: HealthRecordUpdate;
      };
      milk_records: {
        Row: MilkRecordRow;
        Insert: MilkRecordInsert;
        Update: MilkRecordUpdate;
      };
      breeding_records: {
        Row: BreedingRecordRow;
        Insert: BreedingRecordInsert;
        Update: BreedingRecordUpdate;
      };
      feed_formulas: {
        Row: FeedFormulaRow;
        Insert: FeedFormulaInsert;
        Update: FeedFormulaUpdate;
      };
      feeding_records: {
        Row: FeedingRecordRow;
        Insert: FeedingRecordInsert;
        Update: FeedingRecordUpdate;
      };
      medical_records: {
        Row: MedicalRecordRow;
        Insert: MedicalRecordInsert;
        Update: MedicalRecordUpdate;
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: AuditLogInsert;
        Update: AuditLogUpdate;
      };
    };
    Views: {
      active_cows: {
        Row: CowRow;
      };
      recent_health_records: {
        Row: HealthRecordRow & {
          cow_number: string;
          cow_name: string | null;
          recorded_by_name: string;
        };
      };
      monthly_milk_stats: {
        Row: {
          cow_id: string;
          cow_number: string;
          cow_name: string | null;
          month: string;
          record_count: number;
          total_amount: number;
          avg_amount: number;
          max_amount: number;
          min_amount: number;
        };
      };
    };
    Functions: {
      get_cow_pedigree: {
        Args: { target_cow_id: string; generations?: number };
        Returns: {
          cow_id: string;
          cow_number: string;
          cow_name: string | null;
          generation: number;
          relationship: string;
        }[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff_or_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      gender_type: 'male' | 'female';
      cow_status: 'active' | 'culled' | 'sold' | 'dead';
      breed_type: 'holstein' | 'jersey' | 'other';
      health_status: 'good' | 'fair' | 'poor';
      milking_session: 'morning' | 'afternoon' | 'evening';
      breeding_method: 'artificial_insemination' | 'natural_mating';
      pregnancy_result: 'confirmed' | 'not_pregnant' | 'pending';
      cattle_group_type: 'lactating' | 'dry' | 'calf' | 'heifer';
      medical_type: 'vaccination' | 'treatment';
      notification_type: 'health_alert' | 'breeding_reminder' | 'inventory_warning' | 'medical_reminder';
      audit_action: 'INSERT' | 'UPDATE' | 'DELETE';
    };
  };
}

// ============================================================================
// Table Row Types
// ============================================================================

export interface UserRow {
  id: string;
  full_name: string;
  role: 'admin' | 'staff' | 'guest';
  phone: string | null;
  farm_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id: string;
  full_name: string;
  role: 'admin' | 'staff' | 'guest';
  phone?: string | null;
  farm_name?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserUpdate {
  full_name?: string;
  role?: 'admin' | 'staff' | 'guest';
  phone?: string | null;
  farm_name?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

export interface CowRow {
  id: string;
  cow_number: string;
  name: string | null;
  breed: 'holstein' | 'jersey' | 'other';
  gender: 'male' | 'female';
  birth_date: string;
  sire_id: string | null;
  dam_id: string | null;
  status: 'active' | 'culled' | 'sold' | 'dead';
  entry_date: string;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

export interface CowInsert {
  id?: string;
  cow_number: string;
  name?: string | null;
  breed: 'holstein' | 'jersey' | 'other';
  gender: 'male' | 'female';
  birth_date: string;
  sire_id?: string | null;
  dam_id?: string | null;
  status?: 'active' | 'culled' | 'sold' | 'dead';
  entry_date: string;
  photo_url?: string | null;
  notes?: string | null;
  created_by: string;
  updated_by: string;
}

export interface CowUpdate {
  cow_number?: string;
  name?: string | null;
  breed?: 'holstein' | 'jersey' | 'other';
  gender?: 'male' | 'female';
  birth_date?: string;
  sire_id?: string | null;
  dam_id?: string | null;
  status?: 'active' | 'culled' | 'sold' | 'dead';
  entry_date?: string;
  photo_url?: string | null;
  notes?: string | null;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface HealthRecordRow {
  id: string;
  cow_id: string;
  recorded_date: string;
  temperature: number | null;
  mental_status: 'good' | 'fair' | 'poor' | null;
  appetite: 'good' | 'fair' | 'poor' | null;
  fecal_condition: string | null;
  symptoms: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

export interface HealthRecordInsert {
  id?: string;
  cow_id: string;
  recorded_date: string;
  temperature?: number | null;
  mental_status?: 'good' | 'fair' | 'poor' | null;
  appetite?: 'good' | 'fair' | 'poor' | null;
  fecal_condition?: string | null;
  symptoms?: string | null;
  created_by: string;
  updated_by: string;
}

export interface HealthRecordUpdate {
  temperature?: number | null;
  mental_status?: 'good' | 'fair' | 'poor' | null;
  appetite?: 'good' | 'fair' | 'poor' | null;
  fecal_condition?: string | null;
  symptoms?: string | null;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface MilkRecordRow {
  id: string;
  cow_id: string;
  recorded_datetime: string;
  session: 'morning' | 'afternoon' | 'evening';
  amount: number;
  fat_rate: number | null;
  protein_rate: number | null;
  somatic_cell_count: number | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

export interface MilkRecordInsert {
  id?: string;
  cow_id: string;
  recorded_datetime: string;
  session: 'morning' | 'afternoon' | 'evening';
  amount: number;
  fat_rate?: number | null;
  protein_rate?: number | null;
  somatic_cell_count?: number | null;
  created_by: string;
  updated_by: string;
}

export interface MilkRecordUpdate {
  amount?: number;
  fat_rate?: number | null;
  protein_rate?: number | null;
  somatic_cell_count?: number | null;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface BreedingRecordRow {
  id: string;
  dam_id: string;
  sire_id: string | null;
  calf_id: string | null;
  estrus_date: string | null;
  breeding_date: string;
  breeding_method: 'artificial_insemination' | 'natural_mating';
  semen_batch: string | null;
  pregnancy_check_date: string | null;
  pregnancy_result: 'confirmed' | 'not_pregnant' | 'pending' | null;
  expected_calving_date: string | null;
  actual_calving_date: string | null;
  is_difficult_birth: boolean;
  calving_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

export interface BreedingRecordInsert {
  id?: string;
  dam_id: string;
  sire_id?: string | null;
  calf_id?: string | null;
  estrus_date?: string | null;
  breeding_date: string;
  breeding_method: 'artificial_insemination' | 'natural_mating';
  semen_batch?: string | null;
  pregnancy_check_date?: string | null;
  pregnancy_result?: 'confirmed' | 'not_pregnant' | 'pending' | null;
  expected_calving_date?: string | null;
  actual_calving_date?: string | null;
  is_difficult_birth?: boolean;
  calving_notes?: string | null;
  created_by: string;
  updated_by: string;
}

export interface BreedingRecordUpdate {
  sire_id?: string | null;
  calf_id?: string | null;
  estrus_date?: string | null;
  breeding_date?: string;
  breeding_method?: 'artificial_insemination' | 'natural_mating';
  semen_batch?: string | null;
  pregnancy_check_date?: string | null;
  pregnancy_result?: 'confirmed' | 'not_pregnant' | 'pending' | null;
  expected_calving_date?: string | null;
  actual_calving_date?: string | null;
  is_difficult_birth?: boolean;
  calving_notes?: string | null;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface FeedFormulaRow {
  id: string;
  formula_name: string;
  cattle_group: 'lactating' | 'dry' | 'calf' | 'heifer';
  ingredients: any; // JSONB
  nutrition_facts: any | null; // JSONB
  unit_cost: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

export interface FeedFormulaInsert {
  id?: string;
  formula_name: string;
  cattle_group: 'lactating' | 'dry' | 'calf' | 'heifer';
  ingredients: any;
  nutrition_facts?: any | null;
  unit_cost?: number | null;
  is_active?: boolean;
  notes?: string | null;
  created_by: string;
  updated_by: string;
}

export interface FeedFormulaUpdate {
  formula_name?: string;
  cattle_group?: 'lactating' | 'dry' | 'calf' | 'heifer';
  ingredients?: any;
  nutrition_facts?: any | null;
  unit_cost?: number | null;
  is_active?: boolean;
  notes?: string | null;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface FeedingRecordRow {
  id: string;
  cow_id: string | null;
  formula_id: string;
  feeding_datetime: string;
  amount: number;
  actual_cost: number | null;
  cattle_group: 'lactating' | 'dry' | 'calf' | 'heifer' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

export interface FeedingRecordInsert {
  id?: string;
  cow_id?: string | null;
  formula_id: string;
  feeding_datetime: string;
  amount: number;
  actual_cost?: number | null;
  cattle_group?: 'lactating' | 'dry' | 'calf' | 'heifer' | null;
  notes?: string | null;
  created_by: string;
  updated_by: string;
}

export interface FeedingRecordUpdate {
  amount?: number;
  actual_cost?: number | null;
  notes?: string | null;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface MedicalRecordRow {
  id: string;
  cow_id: string;
  veterinarian_id: string | null;
  record_type: 'vaccination' | 'treatment';
  performed_date: string;
  vaccine_name: string | null;
  disease_diagnosis: string | null;
  treatment_plan: string | null;
  medications: any | null; // JSONB
  next_appointment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

export interface MedicalRecordInsert {
  id?: string;
  cow_id: string;
  veterinarian_id?: string | null;
  record_type: 'vaccination' | 'treatment';
  performed_date: string;
  vaccine_name?: string | null;
  disease_diagnosis?: string | null;
  treatment_plan?: string | null;
  medications?: any | null;
  next_appointment_date?: string | null;
  notes?: string | null;
  created_by: string;
  updated_by: string;
}

export interface MedicalRecordUpdate {
  veterinarian_id?: string | null;
  record_type?: 'vaccination' | 'treatment';
  performed_date?: string;
  vaccine_name?: string | null;
  disease_diagnosis?: string | null;
  treatment_plan?: string | null;
  medications?: any | null;
  next_appointment_date?: string | null;
  notes?: string | null;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  related_cow_id: string | null;
  notification_type: 'health_alert' | 'breeding_reminder' | 'inventory_warning' | 'medical_reminder';
  title: string;
  content: string;
  related_record_id: string | null;
  related_table_name: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  related_cow_id?: string | null;
  notification_type: 'health_alert' | 'breeding_reminder' | 'inventory_warning' | 'medical_reminder';
  title: string;
  content: string;
  related_record_id?: string | null;
  related_table_name?: string | null;
  is_read?: boolean;
}

export interface NotificationUpdate {
  is_read?: boolean;
}

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  old_value: any | null; // JSONB
  new_value: any | null; // JSONB
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogInsert {
  id?: string;
  user_id?: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  old_value?: any | null;
  new_value?: any | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface AuditLogUpdate {
  // Audit logs are immutable
}

