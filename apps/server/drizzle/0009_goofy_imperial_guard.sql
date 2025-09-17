CREATE TABLE "live_location_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"duration" integer,
	"expires_at" timestamp,
	"last_location_update" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_location_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"shared_with_personal_code" text NOT NULL,
	"shared_with_user_id" uuid,
	"can_view" boolean DEFAULT true,
	"last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_location_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"accuracy" numeric(8, 2),
	"speed" numeric(8, 2),
	"heading" numeric(5, 2),
	"altitude" numeric(8, 2),
	"battery_level" integer,
	"is_charging" boolean,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "live_location_sessions" ADD CONSTRAINT "live_location_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_location_shares" ADD CONSTRAINT "live_location_shares_session_id_live_location_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_location_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_location_shares" ADD CONSTRAINT "live_location_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_location_updates" ADD CONSTRAINT "live_location_updates_session_id_live_location_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_location_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "live_location_sessions_user_idx" ON "live_location_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "live_location_sessions_active_idx" ON "live_location_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "live_location_shares_session_idx" ON "live_location_shares" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "live_location_shares_personal_code_idx" ON "live_location_shares" USING btree ("shared_with_personal_code");--> statement-breakpoint
CREATE INDEX "live_location_shares_user_idx" ON "live_location_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "live_location_updates_session_idx" ON "live_location_updates" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "live_location_updates_timestamp_idx" ON "live_location_updates" USING btree ("timestamp");