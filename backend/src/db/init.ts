import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Supabase ke liye required
  },
});

export async function initDB(): Promise<void> {
  const client = await pool.connect();

  try {
    // ensure uuid support (important for Supabase/Postgres)
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        locale VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS apps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        config JSONB NOT NULL,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS app_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
        collection VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS csv_imports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        collection VARCHAR(255) NOT NULL,
        filename VARCHAR(500),
        row_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        error_log JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_apps_user_id ON apps(user_id);
      CREATE INDEX IF NOT EXISTS idx_apps_slug ON apps(slug);
      CREATE INDEX IF NOT EXISTS idx_app_data_app_collection ON app_data(app_id, collection);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    `);

    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ DB INIT ERROR:", err);
  } finally {
    client.release();
  }
}