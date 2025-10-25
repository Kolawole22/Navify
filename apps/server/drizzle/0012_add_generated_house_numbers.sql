-- Add generated house number fields to addresses table
ALTER TABLE "addresses" ADD COLUMN "generated_house_number" text;
ALTER TABLE "addresses" ADD COLUMN "h3_index" text;
ALTER TABLE "addresses" ADD COLUMN "h3_resolution" integer DEFAULT 12;

-- Add index for efficient H3 cell queries
CREATE INDEX "addresses_h3_index_idx" ON "addresses" ("h3_index");

-- Add index for generated house number queries
CREATE INDEX "addresses_generated_house_number_idx" ON "addresses" ("generated_house_number");
