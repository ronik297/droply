import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
// Initialize the database connection using Drizzle ORM with Neon

export const db = drizzle(sql, {schema}); // connection via Drizzle ORM
export type { sql }; // exporting to fire raw SQL queries if needed

