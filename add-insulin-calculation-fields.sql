-- Add new insulin calculation fields to calculator_settings table
ALTER TABLE calculator_settings 
ADD COLUMN IF NOT EXISTS insulin_sensitivity_factor NUMERIC NOT NULL DEFAULT 35,
ADD COLUMN IF NOT EXISTS target_bg_value NUMERIC NOT NULL DEFAULT 5.6;

-- Add a comment explaining the insulin_sensitivity_factor
COMMENT ON COLUMN calculator_settings.insulin_sensitivity_factor IS 'How much 1 unit of insulin lowers blood glucose in mg/dL';

-- Add a comment explaining the target_bg_value
COMMENT ON COLUMN calculator_settings.target_bg_value IS 'Target blood glucose level in mmol/L (~100 mg/dL by default)';

-- Add comments to existing columns for clarity
COMMENT ON COLUMN calculator_settings.first_meal_ratio IS 'Insulin-to-carb ratio for first meal (1 unit covers X grams of carbs)';
COMMENT ON COLUMN calculator_settings.other_meal_ratio IS 'Insulin-to-carb ratio for other meals (1 unit covers X grams of carbs)';
COMMENT ON COLUMN calculator_settings.correction_factor IS 'Legacy: Multiplier for correction chart values';
COMMENT ON COLUMN calculator_settings.target_bg_min IS 'Legacy: Target blood glucose minimum in mmol/L';
COMMENT ON COLUMN calculator_settings.target_bg_max IS 'Legacy: Target blood glucose maximum in mmol/L';
