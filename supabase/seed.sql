-- ============================================================================
-- Seed Data for Development and Testing
-- ============================================================================
-- Feature: 001-netlify
-- Date: 2025-10-12
-- Description: Initial test data for development environment
-- ============================================================================

-- NOTE: This file is for testing only. In production, create users through Supabase Auth
-- Create users in Supabase Dashboard > Authentication > Users:
-- 1. admin@test.com (admin role)
-- 2. staff@test.com (staff role)
-- 3. guest@test.com (guest role)

-- ============================================================================
-- SECTION 1: TEST USERS (Extended Information)
-- ============================================================================

-- Skipping user creation - users should be created through Supabase Auth first
-- Then you can manually insert into cow_users table with their actual UUIDs

-- ============================================================================
-- SECTION 2: TEST COWS
-- ============================================================================

-- Skipping test data - create through application after setting up auth users
-- Sample data structure (commented out):
/*
INSERT INTO cows (id, cow_number, name, breed, gender, birth_date, entry_date, status, created_by, updated_by)
VALUES
  ('10000000-0000-0000-0000-000000000001'::uuid, 'CN001', '小花', 'holstein', 'female', '2020-03-15', '2020-03-20', 'active', '<your-user-id>', '<your-user-id>'),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'CN002', '大力', 'holstein', 'male', '2019-06-10', '2019-06-15', 'active', '<your-user-id>', '<your-user-id>');
*/

-- ============================================================================
-- SECTION 3-6: TEST DATA (Commented out - create after setting up auth)
-- ============================================================================

-- All test data has been commented out. 
-- To populate the database:
-- 1. Create users through Supabase Auth dashboard or API
-- 2. Insert cow_users records with real user IDs
-- 3. Use the application UI or API to create test data

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================

