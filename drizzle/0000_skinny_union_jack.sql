CREATE TABLE "survey_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"contestant_id" text NOT NULL,
	"email" text,
	"language" text NOT NULL,
	"answers" jsonb NOT NULL,
	"started_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
