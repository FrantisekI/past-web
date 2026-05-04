import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const surveyResults = pgTable("survey_results", {
  id: serial("id").primaryKey(),
  contestantId: text("contestant_id").notNull(),
  email: text("email"),
  language: text("language").notNull(),
  answers: jsonb("answers").notNull(), // PostgreSQL supports native JSONB
  startedAt: timestamp("started_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
