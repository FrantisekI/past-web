import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const surveyResults = sqliteTable("survey_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contestantId: text("contestant_id").notNull(),
  email: text("email"),
  language: text("language").notNull(),
  answers: text("answers").notNull(), // We'll store JSON as a string
  startedAt: integer("started_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
