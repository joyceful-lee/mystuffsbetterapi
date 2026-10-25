import { neon } from '@neondatabase/serverless';
export function sql() {
  if (!process.env.DATABASE_URL) throw new Error('Database is not configured.');
  return neon(process.env.DATABASE_URL);
}
