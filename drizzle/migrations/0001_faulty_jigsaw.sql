CREATE TABLE "routine_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"routine_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"order" integer NOT NULL,
	"target_sets" integer NOT NULL,
	"target_reps" integer NOT NULL,
	"target_weight" double precision
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sets" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_session_id_exercise_id_set_number_unique" UNIQUE("session_id","exercise_id","set_number");