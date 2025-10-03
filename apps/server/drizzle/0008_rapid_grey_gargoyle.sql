ALTER TABLE "users" ADD COLUMN "personal_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_personal_code_unique" UNIQUE("personal_code");