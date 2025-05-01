-- Migration script to update profiles table structure for new contact fields

-- First, let's add the new fields if they don't exist
DO $$ 
BEGIN
    -- Add parent1 fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'parent1_name') THEN
        ALTER TABLE profiles ADD COLUMN parent1_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'parent1_phone') THEN
        ALTER TABLE profiles ADD COLUMN parent1_phone text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'parent1_email') THEN
        ALTER TABLE profiles ADD COLUMN parent1_email text;
    END IF;
    
    -- Add parent2 fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'parent2_name') THEN
        ALTER TABLE profiles ADD COLUMN parent2_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'parent2_phone') THEN
        ALTER TABLE profiles ADD COLUMN parent2_phone text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'parent2_email') THEN
        ALTER TABLE profiles ADD COLUMN parent2_email text;
    END IF;
    
    -- Add caregiver fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'caregiver_name') THEN
        ALTER TABLE profiles ADD COLUMN caregiver_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'caregiver_phone') THEN
        ALTER TABLE profiles ADD COLUMN caregiver_phone text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'caregiver_email') THEN
        ALTER TABLE profiles ADD COLUMN caregiver_email text;
    END IF;
    
    -- Add notification method field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_method') THEN
        ALTER TABLE profiles ADD COLUMN notification_method text DEFAULT 'sms';
    END IF;
    
    -- Rename notify_parents to notify_contacts if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_parents') THEN
        -- Create notify_contacts if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_contacts') THEN
            ALTER TABLE profiles ADD COLUMN notify_contacts boolean DEFAULT false;
        END IF;
        
        -- Copy data from notify_parents to notify_contacts
        UPDATE profiles SET notify_contacts = notify_parents;
    END IF;
    
    -- Migrate data from mother/father fields to parent1/parent2 if the old fields exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mother_name') THEN
        UPDATE profiles 
        SET parent1_name = mother_name, parent1_phone = mother_phone 
        WHERE mother_name IS NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'father_name') THEN
        UPDATE profiles 
        SET parent2_name = father_name, parent2_phone = father_phone 
        WHERE father_name IS NOT NULL;
    END IF;
    
    -- Drop old columns if they exist (only if we've created the new ones)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_contacts') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_parents') THEN
            ALTER TABLE profiles DROP COLUMN notify_parents;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'parent1_name') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mother_name') THEN
            ALTER TABLE profiles DROP COLUMN mother_name;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mother_phone') THEN
            ALTER TABLE profiles DROP COLUMN mother_phone;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'parent2_name') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'father_name') THEN
            ALTER TABLE profiles DROP COLUMN father_name;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'father_phone') THEN
            ALTER TABLE profiles DROP COLUMN father_phone;
        END IF;
    END IF;
    
END $$;
