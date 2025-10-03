-- Add gridCode column to addresses table for enhanced HHG code format
-- This migration adds support for the new format: NG-XX-YY-ZZZ-GG-NNNN

-- Add grid_code column to addresses table
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS grid_code TEXT;

-- Add index for grid_code for better query performance
CREATE INDEX IF NOT EXISTS addresses_grid_code_idx ON addresses(grid_code);

-- Add comment to document the new column
COMMENT ON COLUMN addresses.grid_code IS 'Grid code for enhanced HHG format (2 characters, base-36 encoded)';
