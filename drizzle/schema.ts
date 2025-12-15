import {
    pgTable,
    serial,
    text,
    timestamp,
    integer,
    boolean,
    doublePrecision,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const exercises = pgTable("exercises", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(), // e.g., 'strength', 'cardio'
    description: text("description"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exercisesRelations = relations(exercises, ({ many }) => ({
    sets: many(sets),
    routineExercises: many(routineExercises),
}));

export const workoutSessions = pgTable("workout_sessions", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(), // Added User Ownership
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time"),
    duration: integer("duration"), // in seconds
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workoutSessionsRelations = relations(
    workoutSessions,
    ({ many }) => ({
        sets: many(sets),
    })
);

export const sets = pgTable("sets", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(), // Added User Ownership
    sessionId: integer("session_id")
        .references(() => workoutSessions.id)
        .notNull(),
    exerciseId: integer("exercise_id")
        .references(() => exercises.id)
        .notNull(),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps"),
    weightKg: doublePrecision("weight_kg"),
    timeInSeconds: integer("time_in_seconds"),
    isCompleted: boolean("is_completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const setsRelations = relations(sets, ({ one }) => ({
    session: one(workoutSessions, {
        fields: [sets.sessionId],
        references: [workoutSessions.id],
    }),
    exercise: one(exercises, {
        fields: [sets.exerciseId],
        references: [exercises.id],
    }),
}));

// --- ROUTINES ---

export const routines = pgTable("routines", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const routinesRelations = relations(routines, ({ many }) => ({
    routineExercises: many(routineExercises),
}));

export const routineExercises = pgTable("routine_exercises", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(), // Added User Ownership
    routineId: integer("routine_id")
        .references(() => routines.id, { onDelete: "cascade" })
        .notNull(),
    exerciseId: integer("exercise_id")
        .references(() => exercises.id, { onDelete: "cascade" })
        .notNull(),
    order: integer("order").notNull(),
    targetSets: integer("target_sets").notNull(),
    targetReps: integer("target_reps").notNull(),
    targetWeight: doublePrecision("target_weight"),
});

export const routineExercisesRelations = relations(
    routineExercises,
    ({ one }) => ({
        routine: one(routines, {
            fields: [routineExercises.routineId],
            references: [routines.id],
        }),
        exercise: one(exercises, {
            fields: [routineExercises.exerciseId],
            references: [exercises.id],
        }),
    })
);
