-- Update the profiles table to add the new parent/caregiver fields and notification method
ALTER TABLE profiles
-- Add new fields
ADD COLUMN parent1_name TEXT,
ADD COLUMN parent1_phone TEXT,
ADD COLUMN parent1_email TEXT,
ADD COLUMN parent2_name TEXT,
ADD COLUMN parent2_phone TEXT,
ADD COLUMN parent2_email TEXT,
ADD COLUMN caregiver_name TEXT,
ADD COLUMN caregiver_phone TEXT,
ADD COLUMN caregiver_email TEXT,
ADD COLUMN notification_method TEXT DEFAULT 'sms';

-- Convert existing data to new format
UPDATE profiles
SET parent1_name = mother_name,
    parent1_phone = mother_phone,
    parent2_name = father_name,
    parent2_phone = father_phone,
    notification_method = 'sms';

-- Rename the notification toggle
ALTER TABLE profiles
RENAME COLUMN notify_parents TO notify_contacts;

-- Drop the old columns (only after migrating the data)
ALTER TABLE profiles
DROP COLUMN mother_name,
DROP COLUMN mother_phone,
DROP COLUMN father_name,
DROP COLUMN father_phone;
