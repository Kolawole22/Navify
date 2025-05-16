ALTER TABLE "addresses" DROP CONSTRAINT "addresses_unique_code_unique";--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "street" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "hhg_code" varchar(50);--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "state_code" varchar(2) NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "lga_code" varchar(3) NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_state_code_states_code_fk" FOREIGN KEY ("state_code") REFERENCES "public"."states"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "unique_code";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "addresses" DROP COLUMN "lga";--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_hhg_code_unique" UNIQUE("hhg_code");