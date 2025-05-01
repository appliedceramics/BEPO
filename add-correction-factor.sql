-- Add correction_factor column to calculator_settings table
ALTER TABLE calculator_settings ADD COLUMN correction_factor NUMERIC NOT NULL DEFAULT 1.0;
