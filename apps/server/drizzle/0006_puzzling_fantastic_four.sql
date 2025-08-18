CREATE TABLE "address_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address_id" serial NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"helpful" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "address_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address_id" serial NOT NULL,
	"shared_by" uuid NOT NULL,
	"shared_with" uuid,
	"share_code" text NOT NULL,
	"expires_at" timestamp,
	"viewed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "address_shares_share_code_unique" UNIQUE("share_code")
);
--> statement-breakpoint
CREATE TABLE "location_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address_id" serial NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"activity" text,
	"visited_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"read" boolean DEFAULT false,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_maps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"region" jsonb NOT NULL,
	"size" integer,
	"downloaded_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"results" integer DEFAULT 0,
	"selected_result" serial NOT NULL,
	"search_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "address_ratings" ADD CONSTRAINT "address_ratings_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address_ratings" ADD CONSTRAINT "address_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address_shares" ADD CONSTRAINT "address_shares_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address_shares" ADD CONSTRAINT "address_shares_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address_shares" ADD CONSTRAINT "address_shares_shared_with_users_id_fk" FOREIGN KEY ("shared_with") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_maps" ADD CONSTRAINT "offline_maps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_selected_result_addresses_id_fk" FOREIGN KEY ("selected_result") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;