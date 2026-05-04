import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Define the database file path
// On a VPS, you might want this to be in a persistent volume or a specific directory
const dbPath = path.join(process.cwd(), 'data/survey.db');

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
