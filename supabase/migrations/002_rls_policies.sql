-- ============================================================================
-- Cow Experiment Data Management System - Row Level Security Policies
-- ============================================================================
-- Feature: 001-netlify
-- Date: 2025-10-12
-- Description: Complete RLS policies for all tables
-- IMPORTANT: Run this AFTER running 001_initial_schema.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cows ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 2: USERS TABLE POLICIES
-- ============================================================================

CREATE POLICY "users_select_all_active" ON users
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admin_all_users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- SECTION 3: COWS TABLE POLICIES
-- ============================================================================

CREATE POLICY "cows_select_all" ON cows
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "cows_insert_staff" ON cows
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "cows_update_staff" ON cows
  FOR UPDATE USING (
    deleted_at IS NULL AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "cows_delete_admin" ON cows
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (deleted_at IS NOT NULL);

-- ============================================================================
-- SECTION 4-11: OTHER TABLE POLICIES
-- ============================================================================

-- Health Records
CREATE POLICY "health_select_all" ON health_records FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "health_insert_staff" ON health_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "health_update_own_or_admin" ON health_records FOR UPDATE USING (
  deleted_at IS NULL AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- Milk Records
CREATE POLICY "milk_select_all" ON milk_records FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "milk_insert_staff" ON milk_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "milk_update_own_or_admin" ON milk_records FOR UPDATE USING (
  deleted_at IS NULL AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- Breeding Records
CREATE POLICY "breeding_select_all" ON breeding_records FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "breeding_insert_staff" ON breeding_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "breeding_update_staff" ON breeding_records FOR UPDATE USING (
  deleted_at IS NULL AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Feed Formulas
CREATE POLICY "formula_select_all" ON feed_formulas FOR SELECT USING (deleted_at IS NULL AND is_active = TRUE);
CREATE POLICY "formula_all_admin" ON feed_formulas FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Feeding Records
CREATE POLICY "feeding_select_staff" ON feeding_records FOR SELECT USING (
  deleted_at IS NULL AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
);
CREATE POLICY "feeding_insert_staff" ON feeding_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "feeding_update_own_or_admin" ON feeding_records FOR UPDATE USING (
  deleted_at IS NULL AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- Medical Records
CREATE POLICY "medical_select_all" ON medical_records FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "medical_insert_staff" ON medical_records FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "medical_update_own_or_admin" ON medical_records FOR UPDATE USING (
  deleted_at IS NULL AND (created_by = auth.uid() OR veterinarian_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
);

-- Notifications
CREATE POLICY "notif_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Audit Logs
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- SECTION 12: SECURITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================

