-- Rowt Database Initialization Script
-- This script sets up the initial database configuration for Rowt server

-- Create database if it doesn't exist (PostgreSQL)
-- Note: This is handled by POSTGRES_DB environment variable in docker-compose

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a function to generate short IDs (used by Rowt for link shortcodes)
CREATE OR REPLACE FUNCTION generate_short_id(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate UUIDs (used by Rowt for various entities)
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions to the rowt_user
GRANT ALL PRIVILEGES ON DATABASE rowt_db TO rowt_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rowt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rowt_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rowt_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rowt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rowt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rowt_user;

-- Create indexes for better performance (these will be created by TypeORM migrations, but we can prepare)
-- Note: Actual table creation will be handled by Rowt's TypeORM migrations

-- Log the initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;

-- Display initialization completion message
DO $$
BEGIN
    RAISE NOTICE 'Rowt database initialization completed successfully';
    RAISE NOTICE 'Database: rowt_db';
    RAISE NOTICE 'User: rowt_user';
    RAISE NOTICE 'Extensions: uuid-ossp, pgcrypto';
    RAISE NOTICE 'Custom functions: generate_short_id(), generate_uuid()';
END $$;
