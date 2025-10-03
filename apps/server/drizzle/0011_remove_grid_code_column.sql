-- Remove grid_code column from addresses table
-- This migration removes the grid_code column as it's no longer needed
-- in the simplified HHG format: NG-XX-YY-ZZZ-HHHH-NNNN

-- Drop the index first
DROP INDEX IF EXISTS addresses_grid_code_idx;

-- Remove the grid_code column
ALTER TABLE addresses DROP COLUMN IF EXISTS grid_code;

-- Add comment to document the change
COMMENT ON TABLE addresses IS 'Addresses table updated to use simplified HHG format without grid_code';
