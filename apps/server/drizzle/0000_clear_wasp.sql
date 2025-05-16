CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"hhg_code" text NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"street" text,
	"city" text,
	"state_code" text,
	"lga_code" text,
	"house_number" text,
	"estate" text,
	"floor" text,
	"landmark" text,
	"special_description" text,
	"category" text,
	"photo_urls" jsonb,
	"is_saved" boolean DEFAULT false,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "addresses_hhg_code_unique" UNIQUE("hhg_code")
);
--> statement-breakpoint
CREATE TABLE "lgas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(3) NOT NULL,
	"state_code" varchar(2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lgas_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "states_name_unique" UNIQUE("name"),
	CONSTRAINT "states_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_state_code_states_code_fk" FOREIGN KEY ("state_code") REFERENCES "public"."states"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_lga_code_lgas_code_fk" FOREIGN KEY ("lga_code") REFERENCES "public"."lgas"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lgas" ADD CONSTRAINT "lgas_state_code_states_code_fk" FOREIGN KEY ("state_code") REFERENCES "public"."states"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_user_id_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "address_hhg_code_idx" ON "addresses" USING btree ("hhg_code");--> statement-breakpoint
CREATE INDEX "address_coords_idx" ON "addresses" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "address_state_lga_idx" ON "addresses" USING btree ("state_code","lga_code");--> statement-breakpoint
CREATE UNIQUE INDEX "state_lga_unique_idx" ON "lgas" USING btree ("state_code","code");--> statement-breakpoint
CREATE UNIQUE INDEX "state_code_idx" ON "states" USING btree ("code");