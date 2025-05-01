-- Add weight field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight numeric;