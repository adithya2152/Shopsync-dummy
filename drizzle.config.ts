import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

console.log(process.env.NEXT_PUBLIC_SUPABASE_CONNECTION_STRING);
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEXT_PUBLIC_SUPABASE_CONNECTION_STRING !,
  },
});
      