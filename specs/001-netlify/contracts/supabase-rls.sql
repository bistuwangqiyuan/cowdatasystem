-- ============================================================================
-- Cow Experiment Data Management System - Row Level Security Policies
-- ============================================================================
-- Feature: 001-netlify
-- Date: 2025-10-11
-- Description: Complete RLS policies for all tables
-- 
-- IMPORTANT: Run this AFTER running supabase-migration.sql
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

-- Users can view all active users (for selecting operators)
CREATE POLICY "users_select_all_active" ON users
  FOR SELECT USING (is_active = TRUE);

-- Users can update their own information
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can manage all users
CREATE POLICY "admin_all_users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 3: COWS TABLE POLICIES
-- ============================================================================

-- All logged-in users can view non-deleted cows
CREATE POLICY "cows_select_all" ON cows
  FOR SELECT USING (deleted_at IS NULL);

-- Admins and staff can create cows
CREATE POLICY "cows_insert_staff" ON cows
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admins and staff can update non-deleted cows
CREATE POLICY "cows_update_staff" ON cows
  FOR UPDATE USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Only admins can soft delete (update deleted_at)
CREATE POLICY "cows_delete_admin" ON cows
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (deleted_at IS NOT NULL);

-- ============================================================================
-- SECTION 4: HEALTH_RECORDS TABLE POLICIES
-- ============================================================================

-- All logged-in users can view non-deleted health records
CREATE POLICY "health_select_all" ON health_records
  FOR SELECT USING (deleted_at IS NULL);

-- Admins and staff can create health records
CREATE POLICY "health_insert_staff" ON health_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Creator and admins can update health records
CREATE POLICY "health_update_own_or_admin" ON health_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- ============================================================================
-- SECTION 5: MILK_RECORDS TABLE POLICIES
-- ============================================================================

-- All logged-in users can view non-deleted milk records
CREATE POLICY "milk_select_all" ON milk_records
  FOR SELECT USING (deleted_at IS NULL);

-- Admins and staff can create milk records
CREATE POLICY "milk_insert_staff" ON milk_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Creator and admins can update milk records
CREATE POLICY "milk_update_own_or_admin" ON milk_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- ============================================================================
-- SECTION 6: BREEDING_RECORDS TABLE POLICIES
-- ============================================================================

-- All logged-in users can view non-deleted breeding records
CREATE POLICY "breeding_select_all" ON breeding_records
  FOR SELECT USING (deleted_at IS NULL);

-- Admins and staff can create breeding records
CREATE POLICY "breeding_insert_staff" ON breeding_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admins and staff can update breeding records
CREATE POLICY "breeding_update_staff" ON breeding_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ============================================================================
-- SECTION 7: FEED_FORMULAS TABLE POLICIES
-- ============================================================================

-- All logged-in users can view active formulas
CREATE POLICY "formula_select_all" ON feed_formulas
  FOR SELECT USING (deleted_at IS NULL AND is_active = TRUE);

-- Only admins can manage formulas (cost is sensitive data)
CREATE POLICY "formula_all_admin" ON feed_formulas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- SECTION 8: FEEDING_RECORDS TABLE POLICIES
-- ============================================================================

-- Staff and admins can view feeding records
-- Note: Actual cost is sensitive, should be filtered at application level for staff
CREATE POLICY "feeding_select_staff" ON feeding_records
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff')
    )
  );

-- Admins and staff can create feeding records
CREATE POLICY "feeding_insert_staff" ON feeding_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Creator and admins can update feeding records
CREATE POLICY "feeding_update_own_or_admin" ON feeding_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- ============================================================================
-- SECTION 9: MEDICAL_RECORDS TABLE POLICIES
-- ============================================================================

-- All logged-in users can view medical records
CREATE POLICY "medical_select_all" ON medical_records
  FOR SELECT USING (deleted_at IS NULL);

-- Admins and staff can create medical records
CREATE POLICY "medical_insert_staff" ON medical_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Creator, veterinarian, and admins can update medical records
CREATE POLICY "medical_update_own_or_admin" ON medical_records
  FOR UPDATE USING (
    deleted_at IS NULL AND
    (created_by = auth.uid() OR veterinarian_id = auth.uid() OR
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- ============================================================================
-- SECTION 10: NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "notif_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can only update their own notifications (mark as read)
CREATE POLICY "notif_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can create notifications (via Service Role Key in Netlify Functions)
-- No INSERT policy for regular users - only service role can insert

-- ============================================================================
-- SECTION 11: AUDIT_LOGS TABLE POLICIES
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "audit_select_admin" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit logs are inserted via triggers, no manual INSERT allowed
-- UPDATE and DELETE are prohibited (audit logs are immutable)

-- ============================================================================
-- SECTION 12: ADDITIONAL SECURITY FUNCTIONS
-- ============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is staff or admin
CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN (
    SELECT role FROM users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 13: TESTING RLS POLICIES (Optional - for development)
-- ============================================================================

-- Test queries to verify RLS policies work correctly
-- Run these queries as different user roles to verify access control

-- Test 1: Admin should see all cows (including deleted)
-- SET ROLE admin_user_id;
-- SELECT * FROM cows;

-- Test 2: Staff should see only active cows
-- SET ROLE staff_user_id;
-- SELECT * FROM cows WHERE deleted_at IS NULL;

-- Test 3: Guest should see only active cows (read-only)
-- SET ROLE guest_user_id;
-- SELECT * FROM cows WHERE deleted_at IS NULL;

-- Test 4: Staff cannot view audit logs
-- SET ROLE staff_user_id;
-- SELECT * FROM audit_logs;  -- Should return no rows

-- Test 5: Admin can view audit logs
-- SET ROLE admin_user_id;
-- SELECT * FROM audit_logs;  -- Should return all logs

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================

