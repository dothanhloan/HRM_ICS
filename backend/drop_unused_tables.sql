-- Drop unused tables from HRM_ICS database
-- Migration: 0007_drop_unused_tables

USE hrm_ics;

-- Drop foreign key constraints first
ALTER TABLE tai_lieu DROP FOREIGN KEY tai_lieu_ibfk_1;
ALTER TABLE tai_lieu DROP FOREIGN KEY fk_tai_lieu_nguoi_tao;
ALTER TABLE nhom_tai_lieu DROP FOREIGN KEY nhom_tai_lieu_ibfk_1;

-- Drop tables
DROP TABLE IF EXISTS tai_lieu;
DROP TABLE IF EXISTS nhom_tai_lieu;
DROP TABLE IF EXISTS lich_trinh;

-- Verify tables are dropped
SHOW TABLES LIKE 'tai_lieu';
SHOW TABLES LIKE 'nhom_tai_lieu';
SHOW TABLES LIKE 'lich_trinh';
