ALTER TABLE "addresses" ADD COLUMN "generated_house_number" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "h3_index" text;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "h3_resolution" integer DEFAULT 12;--> statement-breakpoint
CREATE INDEX "addresses_h3_index_idx" ON "addresses" USING btree ("h3_index");--> statement-breakpoint
CREATE INDEX "addresses_generated_house_number_idx" ON "addresses" USING btree ("generated_house_number");