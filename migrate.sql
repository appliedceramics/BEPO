-- Create milestones table if it doesn't exist
CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  required_count INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  milestone_id INTEGER NOT NULL REFERENCES milestones(id),
  progress INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  earned_at TIMESTAMP,
  data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Add initial milestone data if the table is empty
INSERT INTO milestones (type, name, description, required_count, emoji)
SELECT 'log_streak', 'Consistent Logger', 'Log your insulin for 7 consecutive days', 7, '📆'
WHERE NOT EXISTS (SELECT 1 FROM milestones WHERE type = 'log_streak');

INSERT INTO milestones (type, name, description, required_count, emoji)
SELECT 'perfect_range', 'Blood Sugar Master', 'Maintain your blood glucose in the target range for 5 readings', 5, '🎯'
WHERE NOT EXISTS (SELECT 1 FROM milestones WHERE type = 'perfect_range');

INSERT INTO milestones (type, name, description, required_count, emoji)
SELECT 'precise_carbs', 'Carb Counting Pro', 'Accurately count carbs for 10 meals', 10, '🍎'
WHERE NOT EXISTS (SELECT 1 FROM milestones WHERE type = 'precise_carbs');

INSERT INTO milestones (type, name, description, required_count, emoji)
SELECT 'data_sharer', 'Team Player', 'Share your results with parents 3 times', 3, '🤝'
WHERE NOT EXISTS (SELECT 1 FROM milestones WHERE type = 'data_sharer');

INSERT INTO milestones (type, name, description, required_count, emoji)
SELECT 'voice_user', 'Voice Commander', 'Use voice input 5 times', 5, '🎤'
WHERE NOT EXISTS (SELECT 1 FROM milestones WHERE type = 'voice_user');

INSERT INTO milestones (type, name, description, required_count, emoji)
SELECT 'voice_accuracy', 'Clear Speaker', 'Get highly accurate voice recognition 3 times', 3, '🗣️'
WHERE NOT EXISTS (SELECT 1 FROM milestones WHERE type = 'voice_accuracy');