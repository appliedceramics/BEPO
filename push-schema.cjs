// This script pushes the schema to the database
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Set up NeonDB connection
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('Creating database tables...');

// Creating milestones table with sample data
async function createTables() {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create profiles table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        sex TEXT NOT NULL,
        insulin_to_carb_ratio TEXT NOT NULL,
        correction_factor TEXT NOT NULL,
        target_bg TEXT NOT NULL,
        parent1_contact TEXT,
        parent2_contact TEXT,
        notify_parents BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create insulin_logs table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insulin_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        meal_type TEXT NOT NULL,
        carb_value TEXT,
        bg_value TEXT NOT NULL,
        bg_mgdl TEXT NOT NULL,
        meal_insulin TEXT NOT NULL,
        correction_insulin TEXT NOT NULL,
        total_insulin TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        is_shared BOOLEAN DEFAULT FALSE
      )
    `);
    
    // Create meal_presets table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meal_presets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        carb_value INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create milestones table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        required_count INTEGER NOT NULL,
        emoji TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create achievements table if it doesn't exist
    await pool.query(`
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
      )
    `);
    
    // Add initial milestone data if the table is empty
    const milestonesCount = await pool.query('SELECT COUNT(*) FROM milestones');
    if (parseInt(milestonesCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO milestones (type, name, description, required_count, emoji) VALUES
        ('log_streak', 'Consistent Logger', 'Log your insulin for 7 consecutive days', 7, '📆'),
        ('perfect_range', 'Blood Sugar Master', 'Maintain your blood glucose in the target range for 5 readings', 5, '🎯'),
        ('precise_carbs', 'Carb Counting Pro', 'Accurately count carbs for 10 meals', 10, '🍎'),
        ('data_sharer', 'Team Player', 'Share your results with parents 3 times', 3, '🤝'),
        ('voice_user', 'Voice Commander', 'Use voice input 5 times', 5, '🎤'),
        ('voice_accuracy', 'Clear Speaker', 'Get highly accurate voice recognition 3 times', 3, '🗣️')
      `);
      console.log('Added initial milestone data!');
    }
    
    console.log('Database schema created successfully!');
  } catch (error) {
    console.error('Error creating database schema:', error);
  } finally {
    await pool.end();
  }
}

createTables();