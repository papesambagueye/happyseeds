CREATE TABLE IF NOT EXISTS "raffle_draws" (
  "id" text PRIMARY KEY NOT NULL,
  "month" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "raffle_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "draw_id" text NOT NULL REFERENCES "raffle_draws"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "rank" integer NOT NULL,
  "prize" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "raffle_entries_draw_user_unique" UNIQUE ("draw_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "raffle_entries_draw_idx" ON "raffle_entries" ("draw_id");