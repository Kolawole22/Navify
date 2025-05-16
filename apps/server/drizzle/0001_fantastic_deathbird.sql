ALTER TABLE "addresses" ADD COLUMN "house_number" varchar(50);--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "photo_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "context";